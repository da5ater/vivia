import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const upsert = action({
    args: {
        service: v.union(v.literal("vapi")),
        value: v.object({
            publicApiKey: v.string(),
            privateApiKey: v.string(),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized",
                code: "unauthorized",
            });
        }

        await ctx.runAction(internal.system.secrets.upsert, {
            service: args.service,
            secretName: "apiKeys",
            secretValue: args.value,
        });
    },
});