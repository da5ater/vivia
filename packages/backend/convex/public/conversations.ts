import { mutation, query } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent.js";
import { saveMessage } from "@convex-dev/agent";
import { components } from "../_generated/api.js";

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

    const { threadId } = await supportAgent.createThread(ctx, {
      userId: contactSessionId.toString(),
    });

    await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        // <--- You must nest 'role' and 'content' inside 'message'
        role: "assistant",
        content: "Hello, how can I help you today?",
      },
    });

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

    if (conversation.contactSessionId !== contactSessionId) {
      throw new ConvexError({
        message: "Access to this conversation is unauthorized",
        code: "unauthorized",
      });
    }

    return {
      _id: conversationId,
      status: conversation.status,
      threadId: conversation.threadId,
    };
  },
});
