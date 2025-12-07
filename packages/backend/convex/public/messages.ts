import { v, ConvexError } from "convex/values";
import { action, query } from "../_generated/server.js";
import { internal } from "../_generated/api";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { paginationOptsValidator } from "convex/server";

export const create = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { prompt, threadId, contactSessionId }) => {
    const session = await ctx.runQuery(internal.system.contactSessions.getOne, {
      contactSessionId,
    });
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      { threadId }
    );
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }
    if (conversation.contactSessionId !== contactSessionId) {
      throw new ConvexError({
        message: "Access to this conversation is unauthorized",
        code: "unauthorized",
      });
    }

    if (conversation.status === "resolved") {
      throw new ConvexError("Cannot add messages to a resolved conversation");
    }

    await supportAgent.generateText(
      ctx,
      {
        threadId,
      },
      { prompt }
    );
  },
});

export const getMany = query({
  args: {
    threadId: v.string(),
    contactSessionId: v.id("contact_sessions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, contactSessionId, paginationOpts }) => {
    const session = await ctx.db.get(contactSessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    return await supportAgent.listMessages(ctx, { threadId, paginationOpts });
  },
});
