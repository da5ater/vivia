import { v } from "convex/values";
import { mutation, internalMutation, internalQuery } from "../_generated/server";

export const getOne = internalQuery({
    args: { organizationId: v.optional(v.id("users")) },
    handler: async (ctx, { organizationId }) => {
        if (!organizationId) {
            return null;
        }

        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("byOrganizationId", (q) => q.eq("organizationId", organizationId))
            .unique();
        return subscription;
    },
});

export const initialize = mutation({
    args: {
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const existingSubscription = await ctx.db.query("subscriptions").first();

        if (existingSubscription) {
            await ctx.db.patch(existingSubscription._id, {
                status: args.status,
            });

            return existingSubscription._id;
        }

        const subscriptionId = await ctx.db.insert("subscriptions", {
            status: args.status,
        });

        return subscriptionId;
    },
});

export const upsert = internalMutation({
    args: {
        organizationId: v.optional(v.id("users")),
        subscriberId: v.optional(v.string()),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const existingByOrganization = args.organizationId
            ? await ctx.db
                .query("subscriptions")
                .withIndex("byOrganizationId", (q) => q.eq("organizationId", args.organizationId))
                .unique()
            : null;

        const existingBySubscriber = args.subscriberId
            ? await ctx.db
                .query("subscriptions")
                .withIndex("bySubscriberId", (q) => q.eq("subscriberId", args.subscriberId))
                .unique()
            : null;

        const existingSubscription = existingByOrganization ?? existingBySubscriber;

        if (existingSubscription) {
            await ctx.db.patch(existingSubscription._id, {
                organizationId: args.organizationId ?? existingSubscription.organizationId,
                subscriberId: args.subscriberId ?? existingSubscription.subscriberId,
                status: args.status,
            });

            if (
                existingByOrganization &&
                existingBySubscriber &&
                existingByOrganization._id !== existingBySubscriber._id
            ) {
                await ctx.db.delete(existingBySubscriber._id);
            }

            return existingSubscription._id;
        }

        const subscriptionId = await ctx.db.insert("subscriptions", {
            organizationId: args.organizationId,
            subscriberId: args.subscriberId,
            status: args.status,
        });

        return subscriptionId;
    },
});
