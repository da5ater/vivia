import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { upsertSecret, validateAwsConnection } from "../lib/secrets";
import { internal } from "../_generated/api";

const NAMESPACE = "default";

async function validateVapiKeys(privateKey: string) {
    const res = await fetch("https://api.vapi.ai/health", {
        headers: {
            Authorization: `Bearer ${privateKey}`,
        },
    });

    if (!res.ok) {
        throw new Error("Invalid Vapi API keys");
    }
}

export const upsert = internalAction({
    args: {
        service: v.union(v.literal("vapi")),
        secretName: v.string(),
        secretValue: v.object({
            publicApiKey: v.string(),
            privateApiKey: v.string(),
        }),
    },
    handler: async (ctx, args) => {
        await validateVapiKeys(args.secretValue.privateApiKey);

        const secretKey = `tenant/${NAMESPACE}/${args.service}/${args.secretName}`;

        await upsertSecret(secretKey, args.secretValue);

        await ctx.runMutation(internal.system.plugins.upsert, {
            service: args.service,
            secretName: args.secretName,
        });

        return { status: "success" };
    },
});