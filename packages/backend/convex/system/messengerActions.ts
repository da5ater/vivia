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

function getStatusReply(status: MessengerConversation["status"]) {
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

    // Auto-fetch profile name using Meta Graph API if not provided in the webhook payload
    let profileName = args.profileName;
    if (!profileName) {
      try {
        const fetchedName = await fetchMessengerProfile({
          psid: args.from,
          accessToken: secretData.accessToken,
        });
        if (fetchedName) {
          profileName = fetchedName;
        }
      } catch (error) {
        console.warn("Could not automatically fetch Messenger profile name:", error);
      }
    }

    const conversation = await ctx.runMutation(
      internal.system.messenger.ensureConversationForSender,
      {
        organizationId: config.organizationId,
        from: args.from,
        profileName: profileName,
      }
    ) as MessengerConversation;

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

        // Fallback: If result.text is empty, look at the last assistant message
        // in the database thread to see if a tool (like search) wrote a reply.
        if (!reply) {
          const page = await supportAgent.listMessages(ctx as any, {
            threadId: conversation.threadId,
            paginationOpts: { numItems: 50, cursor: null },
          });
          const messages = page.page;
          
          // Sort messages by _creationTime DESC to guarantee index 0 is the newest message
          const sortedMessages = [...messages].sort(
            (a: any, b: any) => (b._creationTime ?? 0) - (a._creationTime ?? 0)
          );
          
          const lastAssistant = sortedMessages.find((msg: any) => {
            const role = msg.message?.role || msg.role;
            return role === "assistant";
          });

          if (lastAssistant) {
            const content = (lastAssistant as any).text || (lastAssistant as any).message?.content;
            let text = "";
            if (typeof content === "string") {
              text = content;
            } else if (Array.isArray(content)) {
              const textPart = content.find((part: any) => part.type === "text" || typeof part.text === "string");
              text = textPart?.text || "";
            }

            // Avoid sending internal/empty/init messages to the customer
            if (text && text !== "Messenger conversation started.") {
              reply = text;
            }
          }
        }

        if (!reply) {
          const updatedConversation = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            { threadId: conversation.threadId }
          ) as MessengerConversation | null;

          reply = getStatusReply(updatedConversation?.status ?? conversation.status);
        }
      } catch (error) {
        console.error("Messenger support agent generation failed:", error);
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
      await sendMessengerText({
        accessToken: secretData.accessToken,
        to: args.from,
        text: reply,
      });
    }

    return { status: reply ? "sent" : "saved" };
  },
});
