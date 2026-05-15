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

function getStatusReply(status: WhatsAppConversation["status"]) {
  if (status === "resolved") {
    return "I've marked this conversation as resolved. If you need anything else, you can start a new chat anytime.";
  }

  if (status === "escalated") {
    return "I've connected you with our support team. A team member will follow up here soon.";
  }

  return "Thanks for your message. How can I help you today?";
}

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

        if (!reply) {
          const updatedConversation = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            { threadId: conversation.threadId }
          ) as WhatsAppConversation | null;

          reply = getStatusReply(updatedConversation?.status ?? conversation.status);
        }
      } catch (error) {
        console.error("WhatsApp support agent generation failed:", error);
        await saveMessage(ctx, components.agent, {
          threadId: conversation.threadId,
          message: {
            role: "assistant",
            content: TEMPORARY_AI_ERROR_MESSAGE,
          },
        });
        reply = TEMPORARY_AI_ERROR_MESSAGE;
      }
    } else {
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
