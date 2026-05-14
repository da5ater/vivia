import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { saveMessage } from "@convex-dev/agent";
import { components } from "../_generated/api";

export const getByThreadId = internalQuery({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .unique();
    return conversation || null;
  },
});

export const resolve = internalMutation({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .unique();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.status !== "resolved") {
      await ctx.db.patch(conversation._id, { status: "resolved" });
      await saveMessage(ctx, components.agent, {
        threadId,
        message: {
          role: "assistant",
          content:
            "I've marked this conversation as resolved. If you need anything else, you can start a new chat anytime.",
        },
      });
    }
  },
});

export const escalate = internalMutation({
  args: {
    threadId: v.string(),
    customerMessage: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, customerMessage }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .unique();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.status !== "escalated") {
      await ctx.db.patch(conversation._id, { status: "escalated" });
      await saveMessage(ctx, components.agent, {
        threadId,
        message: {
          role: "assistant",
          content:
            customerMessage ??
            "I've connected you with our support team. A team member will follow up here soon.",
        },
      });
    }
  },
});
