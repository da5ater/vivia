import { ConvexError, v } from "convex/values";
import { query } from "../_generated/server";

export const getOneByConversationId = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }

        const user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .unique();
        if (!user) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Conversation not found",
            });
        }

        if (conversation.organizationId !== user._id) {
            throw new ConvexError({
                code: "UNAUTHORIZED",
                message: "Access to this conversation is unauthorized",
            });
        }

        const contactSession = await ctx.db.get(conversation.contactSessionId);

        if (!contactSession) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Contact session not found",
            });
        }

        return contactSession;
    },
});
