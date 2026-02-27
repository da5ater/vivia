import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

const NAMESPACE = "default";

export const getOne = query({
    args: {
        service: v.union(v.literal("vapi")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized",
                code: "unauthorized",
            });
        }

        return await ctx.db
            .query("Plugins")
            .withIndex("byServiceAndNamespace", (q) =>
                q.eq("service", args.service).eq("namespace", NAMESPACE),
            )
            .unique();
    },
});

export const remove = mutation({
    args: {
        service: v.union(v.literal("vapi")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized",
                code: "unauthorized",
            });
        }

        const existingPlugin = await ctx.db
            .query("Plugins")
            .withIndex("byServiceAndNamespace", (q) =>
                q.eq("service", args.service).eq("namespace", NAMESPACE),
            )
            .unique();

        if (!existingPlugin) {
            throw new ConvexError({
                code: "NOT-FOUND",
                message: "Plugin not found",
            });
        }

        await ctx.db.delete(existingPlugin._id);
    },
});