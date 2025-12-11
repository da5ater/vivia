import { mutation, query } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent.js";
import { saveMessage, vMessageDoc } from "@convex-dev/agent";
import { components } from "../_generated/api.js";
import { paginationOptsValidator } from "convex/server";
import { MessageDoc } from "@convex-dev/agent";

export const getMany = query({
  args: {
    contactSessionId: v.id("contact_sessions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { contactSessionId, paginationOpts }) => {
    const session = await ctx.db
      .query("contact_sessions")
      .withIndex("by_id", (q) => q.eq("_id", contactSessionId))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("byContactSessionId", (q) =>
        q.eq("contactSessionId", contactSessionId)
      )
      .order("desc")
      .paginate(paginationOpts);

    const conversationWithLastMessage = await Promise.all(
      conversations.page.map(async (conversation) => {
        let lastMessage: MessageDoc | null = null;

        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        if (messages.page.length > 0) {
          lastMessage = messages.page[0];
        }

        return {
          _id: conversation._id,
          status: conversation.status,
          threadId: conversation.threadId,
          lastMessage,
        };
      })
    );

    return {
      ...conversations,
      page: conversationWithLastMessage,
    };
  },
});

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
