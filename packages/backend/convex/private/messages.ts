import { v, ConvexError } from "convex/values";
import { action, mutation, query } from "../_generated/server.js";
import { components, internal } from "../_generated/api";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { paginationOptsValidator } from "convex/server";
import { saveMessage } from "@convex-dev/agent";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const create = mutation({
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

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    if (conversation.status === "resolved") {
      throw new ConvexError("Cannot add messages to a resolved conversation");
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
    const identity = ctx.auth.getUserIdentity();
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
    const identity = ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }
    const response = await generateText({
      // Use provider directly (not Vercel AI Gateway)
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content:
            "Enhance the operator message to be more professional, clear, and helpful while maintaining their intent and key information.Respnse is headles only the enhanced response ready to be submitted you are a headless tool here no any conversation just the response ",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 3. Return the text directly (Action does not write to DB)
    return response.text;
  },
});
