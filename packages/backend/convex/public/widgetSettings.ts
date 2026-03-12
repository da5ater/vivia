import { query } from "../_generated/server.js";
import { v } from "convex/values";

export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("widgetSettings")
            .first();
    },
});