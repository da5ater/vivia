import { mutation, query } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent.js";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { MessageDoc } from "@convex-dev/agent";
import { Doc } from "../_generated/dataModel.js";

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
    const identity = ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }
    let conversations: PaginationResult<Doc<"conversations">>;

    if (status) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("byStatus", (q) =>
          q.eq("status", status as Doc<"conversations">["status"])
        )
        .order("desc")
        .paginate(paginationOpts);
    } else {
      conversations = await ctx.db
        .query("conversations")
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
          lastMessage = messages.page[0];
        }

        return {
          ...conversation,
          contactSession,
          lastMessage,
        };
      })
    );
    const validatedConversations = conversationsWithDetails.filter(
      (conv): conv is NonNullable<typeof conv> => {
        return conv !== null;
      }
    );

    return {
      ...conversations,
      page: validatedConversations,
    };
  },
});
