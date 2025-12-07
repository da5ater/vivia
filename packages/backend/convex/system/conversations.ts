import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

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
