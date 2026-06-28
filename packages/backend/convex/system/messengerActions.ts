import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { getSecretValue, parseSecretString } from "../lib/secrets";
import { sendMessengerText, fetchMessengerProfile } from "../lib/messenger";
import { supportAgent } from "./ai/agents/supportAgent";
import { escalateConversation } from "./ai/tools/escalateConversation";
import { resolveConversation } from "./ai/tools/resolveConversation";
import { search } from "./ai/tools/search";

const TEMPORARY_AI_ERROR_MESSAGE =
  "I'm having trouble answering automatically right now. Please try again in a moment.";

type IncomingMessageStatus = { status: "ignored" | "saved" | "sent" };

type MessengerConfig = {
  organizationId: Id<"users">;
  secretName: string;
  isEnabled: boolean;
};

type MessengerConversation = {
  threadId: string;
  status: "unresolved" | "resolved" | "escalated";
};

export const handleIncomingMessage = internalAction({
  args: {
    pageId: v.string(),
    from: v.string(),
    profileName: v.optional(v.string()),
    text: v.string(),
  },
  handler: async (ctx, args): Promise<IncomingMessageStatus> => {
    const config = await ctx.runQuery(
      internal.system.messenger.getByPageId,
      { pageId: args.pageId }
    ) as MessengerConfig | null;

    if (!config || !config.isEnabled) {
      return { status: "ignored" };
    }

    const secretValue = await getSecretValue(
      ctx,
      `tenant/${config.organizationId}/messenger/${config.secretName}`
    );
    const secretData = parseSecretString<{ accessToken: string }>(secretValue);

    if (!secretData?.accessToken) {
      throw new Error("Messenger access token not found");
    }

    // Auto-fetch profile name/pic using Meta Graph API
    let profileName = args.profileName;
    let avatarUrl: string | undefined = undefined;

    try {
      const fetchedProfile = await fetchMessengerProfile({
        psid: args.from,
        accessToken: secretData.accessToken,
      });
      if (fetchedProfile) {
        if (!profileName && fetchedProfile.name) {
          profileName = fetchedProfile.name;
        }
        avatarUrl = fetchedProfile.profilePic;
      }
    } catch (error) {
      console.warn("Could not automatically fetch Messenger profile info:", error);
    }

    const conversation = await ctx.runMutation(
      internal.system.messenger.ensureConversationForSender,
      {
        organizationId: config.organizationId,
        from: args.from,
        profileName: profileName,
        avatarUrl: avatarUrl,
      }
    ) as MessengerConversation;

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
        if (!reply) {
          const lastMessages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
            threadId: conversation.threadId,
            order: "desc",
            paginationOpts: { numItems: 5, cursor: null },
          });
          const newestAssistant = lastMessages?.page?.find(
            (m: any) => (m.message?.role ?? m.role) === "assistant" && m.status !== "pending" && m.text !== "Messenger conversation started."
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
        }
      } catch (error) {
        console.error("Messenger support agent generation failed:", error);

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
      await sendMessengerText({
        accessToken: secretData.accessToken,
        to: args.from,
        text: reply,
      });
    }

    return { status: reply ? "sent" : "saved" };
  },
});
