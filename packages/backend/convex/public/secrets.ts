/**
 * Public Secrets Handlers
 * 
 * This file handles retrieving "public" portions of secrets needed by the 
 * frontend, specifically for integrations like Vapi (voice AI).
 * It ensures that sensitive private keys remain hidden while providing
 * necessary public identifiers to the client.
 */

import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { getSecretValue, parseSecretString } from "../lib/secrets";

/**
 * Retrieves the public API key for the Vapi integration for a specific organization.
 * 
 * Vapi requires a public key to initialize its voice widget on the frontend.
 * This function looks up the organization's Vapi plugin settings, retrieves 
 * the encrypted secret, parses it, and returns ONLY the public key.
 * 
 * Simple Example:
 * If a company wants to use voice chat, their website needs a "Public Key" to 
 * talk to the voice server. This function gives them that key securely.
 * 
 * @param organizationId - The ID of the organization whose secrets we are fetching.
 * @returns An object containing the 'publicApiKey', or null if not found.
 */
export const getVapiSecrets = action({
    args: { organizationId: v.id("users") },
    handler: async (ctx, args): Promise<{ publicApiKey: string } | null> => {
        // 1. Find the Vapi plugin configuration for this organization
        const plugin = await ctx.runQuery(
            internal.system.plugins.getByServiceAndNamespace,
            { service: "vapi", namespace: args.organizationId }
        );

        if (!plugin) {
            return null;
        }

        // 2. Build the unique path to the secret in our vault
        const secretName = `tenant/${args.organizationId}/vapi/${plugin.secretName}`;
        
        // 3. Retrieve the secret value (this is a secure operation)
        const secret = await getSecretValue(ctx, secretName);

        // 4. Parse the secret string into a usable object
        const secretData = parseSecretString<{
            privateApiKey: string;
            publicApiKey: string;
        }>(secret);

        // 5. Safety check: make sure the data we expected is actually there
        if (!secretData?.publicApiKey || !secretData?.privateApiKey) return null;

        // 6. Return ONLY the public key. The private key NEVER leaves the server.
        return { publicApiKey: secretData.publicApiKey };
    },
});