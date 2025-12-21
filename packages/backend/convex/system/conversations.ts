import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

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

    await ctx.db.patch(conversation._id, { status: "resolved" });
  },
});

export const escalate = internalMutation({
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

    await ctx.db.patch(conversation._id, { status: "escalated" });
  },
});
