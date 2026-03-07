import { VapiClient, Vapi } from "@vapi-ai/server-sdk";
import { internal } from "../_generated/api"
import { action } from "../_generated/server";
import { getSecretValue, parseSecretString } from "../lib/secrets";
import { ConvexError, v } from "convex/values";

export const getAssistants = action({
    args: {},
    handler: async (ctx): Promise<Vapi.Assistant[]> => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized",
                code: "NOT_FOUND",
            });
        }
        const plugin = await ctx.runQuery(
            internal.system.plugins.getByServiceAndNamespace,
            {
                service: "vapi",
            }
        );
        if (!plugin) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Vapi plugin not found"
            });
        }

        const secretName = `tenant/default/vapi/${plugin.secretName}`;
        const secretValue = await getSecretValue(ctx, secretName);
        const secretData = parseSecretString<{
            privateApiKey: string;
            publicApiKey: string;
        }>(secretValue);

        if (!secretData) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Credentials not found"
            });
        }
        if (!secretData.privateApiKey || !secretData.publicApiKey) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Credentials incomplete, Please reconnect Your Vapi account "
            });
        }
        const vapiClient = new VapiClient({
            token: secretData.privateApiKey,
        });

        const assistants = await vapiClient.assistants.list();
        return assistants;
    },
});



export const getPhoneNumbers = action({
    args: {},
    handler: async (ctx): Promise<Vapi.ListPhoneNumbersResponseItem[]> => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new ConvexError({
                message: "Unauthorized",
                code: "NOT_FOUND",
            });
        }
        const plugin = await ctx.runQuery(
            internal.system.plugins.getByServiceAndNamespace,
            {
                service: "vapi",
            }
        );
        if (!plugin) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Vapi plugin not found"
            });
        }

        const secretName = `tenant/default/vapi/${plugin.secretName}`;
        const secretValue = await getSecretValue(ctx, secretName);
        const secretData = parseSecretString<{
            privateApiKey: string;
            publicApiKey: string;
        }>(secretValue);

        if (!secretData) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Credentials not found"
            });
        }
        if (!secretData.privateApiKey || !secretData.publicApiKey) {
            throw new ConvexError({
                code: "NOT_FOUND",
                message: "Credentials incomplete, Please reconnect Your Vapi account "
            });
        }
        const vapiClient = new VapiClient({
            token: secretData.privateApiKey,
        });

        const phoneNumbers = await vapiClient.phoneNumbers.list();
        return phoneNumbers;
    },
});
