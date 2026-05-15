import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { getSecretValue, parseSecretString } from "../lib/secrets";
import { supportAgent } from "./ai/agents/supportAgent";
import { escalateConversation } from "./ai/tools/escalateConversation";
import { resolveConversation } from "./ai/tools/resolveConversation";
import { search } from "./ai/tools/search";

const WHATSAPP_API_VERSION = "v21.0";

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

async function sendWhatsAppText(args: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${args.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: args.to,
        type: "text",
        text: {
          preview_url: false,
          body: args.text,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }
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
        await ctx.runMutation(internal.system.conversations.escalate, {
          threadId: conversation.threadId,
          customerMessage:
            "I'm having trouble answering automatically right now, so I've connected you with our support team. A team member will follow up here soon.",
        });
        reply =
          "I'm having trouble answering automatically right now, so I've connected you with our support team. A team member will follow up here soon.";
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
