import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalMutation, internalQuery } from "../_generated/server";
import { saveMessage } from "@convex-dev/agent";
import { components, internal } from "../_generated/api";

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

export const getOperatorReplyContext = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    userEmail: v.string(),
  },
  handler: async (ctx, { conversationId, userEmail }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", userEmail))
      .unique();

    if (!user) {
      return null;
    }

    const conversation = await ctx.db.get(conversationId);

    if (!conversation || conversation.organizationId !== user._id) {
      return null;
    }

    const contactSession = await ctx.db.get(conversation.contactSessionId);

    if (!contactSession) {
      return null;
    }

    return {
      _id: conversation._id,
      organizationId: conversation.organizationId as Id<"users">,
      contactSessionId: conversation.contactSessionId,
      threadId: conversation.threadId,
      status: conversation.status,
      contactSession,
    };
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

      await ctx.scheduler.runAfter(
        0,
        internal.summarize.summarizeConversation,
        { threadId }
      );
    }
  },
});

export const escalate = internalMutation({
  args: {
    threadId: v.string(),
    customerMessage: v.optional(v.string()),
    silent: v.optional(v.boolean()),
  },
  handler: async (ctx, { threadId, customerMessage, silent }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .unique();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.status !== "escalated") {
      await ctx.db.patch(conversation._id, { status: "escalated" });
      
      if (!silent) {
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

      await ctx.scheduler.runAfter(
        0,
        internal.summarize.summarizeConversation,
        { threadId }
      );
    }
  },
});

export const saveSummary = internalMutation({
  args: {
    threadId: v.string(),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { threadId, summary, tags }) => {
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("byThreadId", (q) => q.eq("threadId", threadId))
      .unique();

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(conversation._id, {
      summary,
      tags,
    });
  },
});
