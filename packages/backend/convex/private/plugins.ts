import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";


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

        const user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .unique();
        if (!user) throw new ConvexError({ message: "User not found", code: "not_found" });

        return await ctx.db
            .query("Plugins")
            .withIndex("byServiceAndNamespace", (q) =>
                q.eq("service", args.service).eq("namespace", user._id),
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

        const user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .unique();
        if (!user) throw new ConvexError({ message: "User not found", code: "not_found" });

        const existingPlugin = await ctx.db
            .query("Plugins")
            .withIndex("byServiceAndNamespace", (q) =>
                q.eq("service", args.service).eq("namespace", user._id),
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
