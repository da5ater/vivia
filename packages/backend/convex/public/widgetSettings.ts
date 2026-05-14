/**
 * Public Widget Settings Handlers
 * 
 * This file provides the configuration settings for the chat widget.
 * When the widget loads on a website, it calls this to know what colors, 
 * greeting messages, and features should be active for that specific company.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Retrieves the settings for a chat widget based on the company's unique slug.
 * 
 * This function looks up the organization and then fetches its specific 
 * widget configuration (like the greeting message or if the widget is even enabled).
 * 
 * Simple Example:
 * When the widget loads on "acme.com", it asks for the settings for "acme-corp".
 * This function returns "Hello! Welcome to Acme Support" and other settings
 * so the widget looks and acts correctly.
 * 
 * @param slug - The unique identifier for the organization (e.g., "acme-corp").
 * @returns An object containing the widget's configuration or null if not found.
 */
export const get = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const slug = args.slug.trim().toLowerCase();

        // 1. Find the organization (user) by their unique slug
        const user = await ctx.db
            .query("users")
            .withIndex("bySlug", (q) => q.eq("slug", slug))
            .first();
        if (!user) return null;

        // 2. Fetch the widget settings linked to this organization
        const settings = await ctx.db
            .query("widgetSettings")
            .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
            .first();
        if (!settings) return null;

        // 3. Return the relevant settings to the frontend
        return {
            isActive: settings.isActive ?? true,
            greetMessage: settings.greetMessage,
            defaultSuggestions: settings.defaultSuggestions,
            assistantId: settings.vapiSettings?.assistantId,
            phoneNumber: settings.vapiSettings?.phoneNumber,
            organizationId: user._id,
            organizationName: user.name,
        };
    },
});
