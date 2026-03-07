import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { getSecretValue, parseSecretString } from "../lib/secrets";

export const getVapiSecrets = action({
    handler: async (ctx) => {
        const plugin = await ctx.runQuery(
            internal.system.plugins.getByServiceAndNamespace,
            { service: "vapi" }
        );

        if (!plugin) {
            throw new ConvexError({ code: "NOT_FOUND", message: "Plugin not found" });
        }

        const secretName = `tenant/default/vapi/${plugin.secretName}`;
        const secret = await getSecretValue(ctx, secretName);

        const secretData = parseSecretString<{
            privateApiKey: string;
            publicApiKey: string;
        }>(secret);

        if (!secretData?.publicApiKey || !secretData?.privateApiKey) return null;

        return { publicApiKey: secretData.publicApiKey };
    },
});