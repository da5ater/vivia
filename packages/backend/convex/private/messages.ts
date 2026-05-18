import { v, ConvexError } from "convex/values";
import { action, query } from "../_generated/server.js";
import { components, internal } from "../_generated/api";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { paginationOptsValidator } from "convex/server";
import { saveMessage } from "@convex-dev/agent";
import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { getModel } from "../system/ai/models.js";
import { OPERATOR_MESSAGE_ENHANCEMENT_PROMPT } from "../system/ai/constants.js";
import { getSecretValue, parseSecretString } from "../lib/secrets.js";
import { sendWhatsAppText } from "../lib/whatsapp.js";

export const create = action({
  args: {
    prompt: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { prompt, conversationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getOperatorReplyContext,
      {
        conversationId,
        userEmail: identity.email!.toLowerCase(),
      }
    );

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    if (conversation.status === "resolved") {
      throw new ConvexError("Cannot add messages to a resolved conversation");
    }

    if (conversation.status === "unresolved") {
      await ctx.runMutation(internal.system.conversations.escalate, {
        threadId: conversation.threadId,
      });
    }

    const whatsappFrom = conversation.contactSession.metadata?.whatsappFrom;

    if (whatsappFrom) {
      const config = await ctx.runQuery(
        internal.system.whatsapp.getByOrganizationId,
        { organizationId: conversation.organizationId }
      );

      if (!config || !config.isEnabled) {
        throw new ConvexError("WhatsApp integration is not enabled");
      }

      const secretValue = await getSecretValue(
        ctx,
        `tenant/${config.organizationId}/whatsapp/${config.secretName}`
      );
      const secretData = parseSecretString<{ accessToken: string }>(secretValue);

      if (!secretData?.accessToken) {
        throw new ConvexError("WhatsApp access token not found");
      }

      await sendWhatsAppText({
        phoneNumberId: config.phoneNumberId,
        accessToken: secretData.accessToken,
        to: whatsappFrom,
        text: prompt,
      });
    }

    await saveMessage(ctx, components.agent, {
      threadId: conversation.threadId,
      agentName:
        typeof identity.agentName === "string" ? identity.agentName : undefined,
      message: {
        role: "assistant",
        content: prompt,
      },
    });
  },
});
export const getMany = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, paginationOpts }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .unique();

    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    return await supportAgent.listMessages(ctx, { threadId, paginationOpts });
  },
});

export const enhanceResponse = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { prompt, threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }
    try {
      const response = await generateText({
      // Use provider directly (not Vercel AI Gateway)
      model: getModel("enhancer") as LanguageModel,
      messages: [
        {
          role: "system",
          content: OPERATOR_MESSAGE_ENHANCEMENT_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 3. Return the text directly (Action does not write to DB)
    return response.text;
    } catch (error) {
      console.error("Error enhancing response:", error);
      throw new ConvexError("Failed to enhance response. The AI service might be temporarily unavailable.");
    }
  },
});
