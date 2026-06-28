import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { getSecretValue, parseSecretString } from "../lib/secrets";
import { sendWhatsAppText } from "../lib/whatsapp";
import { supportAgent } from "./ai/agents/supportAgent";
import { escalateConversation } from "./ai/tools/escalateConversation";
import { resolveConversation } from "./ai/tools/resolveConversation";
import { search } from "./ai/tools/search";

const TEMPORARY_AI_ERROR_MESSAGE =
  "I'm having trouble answering automatically right now. Please try again in a moment.";

type IncomingMessageStatus = { status: "ignored" | "saved" | "sent" };

type WhatsAppConfig = {
  organizationId: Id<"users">;
  secretName: string;
  isEnabled: boolean;
};

type WhatsAppConversation = {
  threadId: string;
  status: "unresolved" | "resolved" | "escalated";
};

export const handleIncomingMessage = internalAction({
  args: {
    phoneNumberId: v.string(),
    from: v.string(),
    profileName: v.optional(v.string()),
    text: v.string(),
  },
  handler: async (ctx, args): Promise<IncomingMessageStatus> => {
    const config = await ctx.runQuery(
      internal.system.whatsapp.getByPhoneNumberId,
      { phoneNumberId: args.phoneNumberId }
    ) as WhatsAppConfig | null;

    if (!config || !config.isEnabled) {
      return { status: "ignored" };
    }

    const secretValue = await getSecretValue(
      ctx,
      `tenant/${config.organizationId}/whatsapp/${config.secretName}`
    );
    const secretData = parseSecretString<{ accessToken: string }>(secretValue);

    if (!secretData?.accessToken) {
      throw new Error("WhatsApp access token not found");
    }

    const conversation = await ctx.runMutation(
      internal.system.whatsapp.ensureConversationForSender,
      {
        organizationId: config.organizationId,
        from: args.from,
        profileName: args.profileName,
      }
    ) as WhatsAppConversation;

    let reply: string | null = null;

    if (conversation.status === "unresolved") {
      try {
        // Use `prompt` so the agent properly tracks the user message and tool loop natively.
        const result = await supportAgent.generateText(
          ctx,
          {
            threadId: conversation.threadId,
          },
          {
            prompt: args.text,
            tools: {
              escalateConversation,
              resolveConversation,
              search,
            },
          } as any
        ) as { text?: string };

        reply = result.text?.trim() || null;

        // If result.text is empty, check the database. 
        // This happens if a tool was called (like search) and the agent either output no text 
        // or a different status was reached.
        if (!reply) {
          const updatedConversation = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            { threadId: conversation.threadId }
          ) as WhatsAppConversation | null;

          const updatedStatus = updatedConversation?.status ?? conversation.status;

          if (updatedStatus === "unresolved") {
            // Find the most recent assistant message generated during this execution
            const lastMessages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
              threadId: conversation.threadId,
              order: "desc",
              paginationOpts: { numItems: 5, cursor: null },
            });
            const newestAssistant = lastMessages?.page?.find(
              (m: any) => (m.message?.role ?? m.role) === "assistant" && m.status !== "pending"
            );

            if (newestAssistant && newestAssistant.message?.content) {
              // Agent wrote to DB directly (e.g. via tool loop output) but text was empty on the return object
              const content = newestAssistant.message.content;
              if (typeof content === "string") {
                reply = content;
              } else if (Array.isArray(content)) {
                const textPart = content.find((p: any) => p.type === "text") as { text: string } | undefined;
                reply = textPart?.text || "Thanks for your message. How can I help you today?";
              } else {
                reply = "Thanks for your message. How can I help you today?";
              }
            } else {
              // Truly empty reply, no DB message found either
              reply = "Thanks for your message. How can I help you today?";
            }
          } else {
            // Tool was called (resolved/escalated) — tool already wrote the message, skip reply
            reply = null;
          }
        }
      } catch (error) {
        console.error("WhatsApp support agent generation failed:", error);

        // Smart recovery: check if the agent managed to save the user message before failing
        const lastMessages = await ctx.runQuery(
          components.agent.messages.listMessagesByThreadId,
          {
            threadId: conversation.threadId,
            order: "desc",
            paginationOpts: { numItems: 2, cursor: null },
          }
        );
        const messages = lastMessages?.page ?? [];

        const userMessageSaved = messages.some(
          (m: any) =>
            (m.message?.role ?? m.role) === "user" &&
            ((m.message?.content ?? m.text) === args.text)
        );

        if (!userMessageSaved) {
          await saveMessage(ctx, components.agent, {
            threadId: conversation.threadId,
            message: { role: "user", content: args.text },
          });
        }

        const latestMessage = messages[0];
        if (latestMessage && latestMessage.status === "failed") {
          await ctx.runMutation(components.agent.messages.updateMessage, {
            messageId: latestMessage._id,
            patch: {
              status: "success",
              message: {
                role: "assistant",
                content: TEMPORARY_AI_ERROR_MESSAGE,
              },
            },
          });
        } else {
          await saveMessage(ctx, components.agent, {
            threadId: conversation.threadId,
            message: {
              role: "assistant",
              content: TEMPORARY_AI_ERROR_MESSAGE,
            },
          });
        }
        reply = TEMPORARY_AI_ERROR_MESSAGE;
      }
    } else {
      // Conversation is escalated — just save the user message, no AI reply
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: {
          role: "user",
          content: args.text,
        },
      });
      reply = null;
    }

    if (reply) {
      await sendWhatsAppText({
        phoneNumberId: args.phoneNumberId,
        accessToken: secretData.accessToken,
        to: args.from,
        text: reply,
      });
    }

    return { status: reply ? "sent" : "saved" };
  },
});
