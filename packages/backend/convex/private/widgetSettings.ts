import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const upsert = mutation({
    args: {
        greetMessage: v.string(),
        defaultSuggestions: v.object({
            suggestion1: v.string(),
            suggestion2: v.string(),
            suggestion3: v.string(),
        }),
        vapiSettings: v.object({
            assistantId: v.optional(v.string()),
            phoneNumber: v.optional(v.string()),
        }),


    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized User",
                code: "unauthorized",
            });
        }

        const existingWidgetSettings = await ctx.db
            .query("widgetSettings")
            .first();

        if (existingWidgetSettings) {
            await ctx.db.patch(existingWidgetSettings._id, args);
        } else {
            await ctx.db.insert("widgetSettings", args);
        }


    },
});
export const getOne = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized User",
                code: "unauthorized",
            });
        }

        const widgetSettings = await ctx.db
            .query("widgetSettings")
            .first();

        return widgetSettings;
    },
});