import { mutation, query } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";

export const create = mutation({
  args: {
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { contactSessionId }) => {
    const now = Date.now();
    const session = await ctx.db.get(contactSessionId);
    if (!session) {
      throw new ConvexError("Contact session not found");
    }
    if (session.expiresAt < now) {
      throw new ConvexError("Contact session has expired");
    }

    const threadId = "123";

    const conversationId = await ctx.db.insert("conversations", {
      contactSessionId,
      threadId,
      status: "unresolved",
      createdAt: now,
    });

    return conversationId;
  },
});

export const getOne = query({
  args: {
    conversationId: v.id("conversations"),
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { conversationId, contactSessionId }) => {
    const session = await ctx.db.get(contactSessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    return {
      _id: conversationId,
      status: conversation.status,
      threadId: conversation.threadId,
    };
  },
});
