import { mutation, query, QueryCtx, MutationCtx } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent.js";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { MessageDoc } from "@convex-dev/agent";
import { Doc } from "../_generated/dataModel.js";

async function requireCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ message: "Unauthorized", code: "unauthorized" });
  }

  return await ctx.db
    .query("users")
    .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
    .unique();
}

export const getMany = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("unresolved"),
        v.literal("resolved"),
        v.literal("escalated")
      )
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { status, paginationOpts }) => {
    const user = await requireCurrentUser(ctx);

    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "0",
        splitCursor: null,
        pageStatus: "SplitRecommended" as const,
      };
    }

    let conversations: PaginationResult<Doc<"conversations">>;

    if (status) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("byOrganizationIdAndStatus", (q) =>
          q.eq("organizationId", user._id).eq("status", status)
        )
        .order("desc")
        .paginate(paginationOpts);
    } else {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("byOrganizationId", (q) =>
          q.eq("organizationId", user._id)
        )
        .order("desc")
        .paginate(paginationOpts);
    }

    const conversationsWithDetails = await Promise.all(
      conversations.page.map(async (conversation) => {
        let lastMessage: MessageDoc | null = null;

        const contactSession = await ctx.db.get(conversation.contactSessionId);
        if (!contactSession) {
          return null;
        }

        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        if (messages.page.length > 0) {
          lastMessage = messages.page[0] ?? null;
        }

        return {
          ...conversation,
          contactSession,
          lastMessage,
        };
      })
    );

    const validatedConversations = conversationsWithDetails.filter(
      (conv): conv is NonNullable<typeof conv> => conv !== null
    );

    return {
      ...conversations,
      page: validatedConversations,
    };
  },
});

export const getOne = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const user = await requireCurrentUser(ctx);
    if (!user) {
      throw new ConvexError({ message: "User not found", code: "not_found" });
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError({
        message: "Conversation not found",
        code: "not_found",
      });
    }

    if (conversation.organizationId !== user._id) {
      throw new ConvexError({
        message: "Access to this conversation is unauthorized",
        code: "unauthorized",
      });
    }

    const contactSession = await ctx.db.get(conversation.contactSessionId);
    if (!contactSession) {
      throw new ConvexError({
        message: "Contact session not found",
        code: "not_found",
      });
    }

    return {
      ...conversation,
      contactSession,
    };
  },
});

export const updateStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(
      v.literal("unresolved"),
      v.literal("resolved"),
      v.literal("escalated")
    ),
  },
  handler: async (ctx, { conversationId, status }) => {
    const user = await requireCurrentUser(ctx);
    if (!user) {
      throw new ConvexError({ message: "User not found", code: "not_found" });
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError({
        message: "Conversation not found",
        code: "not_found",
      });
    }

    if (conversation.organizationId !== user._id) {
      throw new ConvexError({
        message: "Access to this conversation is unauthorized",
        code: "unauthorized",
      });
    }

    await ctx.db.patch(conversationId, { status });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireCurrentUser(ctx);

    if (!user) {
      return { total: 0, unresolved: 0, resolved: 0, escalated: 0 };
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
      .collect();

    let total = 0;
    let unresolved = 0;
    let resolved = 0;
    let escalated = 0;

    for (const conv of conversations) {
      total++;
      if (conv.status === "unresolved") unresolved++;
      if (conv.status === "resolved") resolved++;
      if (conv.status === "escalated") escalated++;
    }

    return { total, unresolved, resolved, escalated };
  },
});
