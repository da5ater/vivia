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
            throw new ConvexError({ message: "Unauthorized User", code: "unauthorized" });
        }

        let user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .first();
        if (!user) {
            const userId = await ctx.db.insert("users", {
                name: identity.name ?? "User",
                email: identity.email!.toLowerCase(),
                createdAt: Date.now(),
            });
            user = await ctx.db.get(userId);
            if (!user) throw new ConvexError({ message: "User not found", code: "not_found" });
        }

        const existing = await ctx.db
            .query("widgetSettings")
            .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("widgetSettings", {
                ...args,
                organizationId: user._id,
                isActive: true,
            });
        }
    },
});

export const getOne = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError({ message: "Unauthorized User", code: "unauthorized" });
        }

        const user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .first();
        if (!user) return null;

        const settings = await ctx.db
            .query("widgetSettings")
            .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
            .first();

        return settings ? { ...settings, slug: user.slug } : null;
    },
});

export const updateSlug = mutation({
    args: {
        slug: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError({ message: "Unauthorized User", code: "unauthorized" });
        }

        let user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .first();
        if (!user) {
            const userId = await ctx.db.insert("users", {
                name: identity.name ?? "User",
                email: identity.email!.toLowerCase(),
                createdAt: Date.now(),
            });
            user = await ctx.db.get(userId);
            if (!user) throw new ConvexError({ message: "User not found", code: "not_found" });
        }

        // PROTECT: Block changing FROM 'vivia' if they already have it
        if (user.slug === "vivia") {
            throw new ConvexError({
                message: "The 'vivia' slug is protected and cannot be changed",
                code: "slug_protected",
            });
        }

        // RATE LIMIT: Logical period (24 hours = 86,400,000ms)
        const SLUG_CHANGE_COOLDOWN = 24 * 60 * 60 * 1000;
        if (user.lastSlugChangedAt) {
            const timeSinceLastChange = Date.now() - user.lastSlugChangedAt;
            if (timeSinceLastChange < SLUG_CHANGE_COOLDOWN) {
                const hoursLeft = Math.ceil(
                    (SLUG_CHANGE_COOLDOWN - timeSinceLastChange) / (60 * 60 * 1000)
                );
                throw new ConvexError({
                    message: `You can only change your slug once every 24 hours. Please try again in ${hoursLeft} hours.`,
                    code: "slug_rate_limited",
                });
            }
        }

        const slugBody = args.slug
            .trim()
            .toLowerCase()
            .replace(/^vivia-/, "");

        if (!slugBody) {
            throw new ConvexError({
                message: "Slug is required",
                code: "invalid_slug",
            });
        }

        const fullSlug = `vivia-${slugBody}`;

        // Validate: lowercase letters, numbers, hyphens only
        if (!/^[a-z0-9-]+$/.test(fullSlug)) {
            throw new ConvexError({
                message: "Slug may only contain lowercase letters, numbers, and hyphens",
                code: "invalid_slug",
            });
        }

        const taken = await ctx.db
            .query("users")
            .withIndex("bySlug", (q) => q.eq("slug", fullSlug))
            .first();
        if (taken && taken._id !== user._id) {
            throw new ConvexError({ message: "This name is already taken.", code: "slug_taken" });
        }

        await ctx.db.patch(user._id, {
            slug: fullSlug,
            lastSlugChangedAt: Date.now(),
        });

        const existing = await ctx.db
            .query("widgetSettings")
            .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
            .first();

        if (!existing) {
            await ctx.db.insert("widgetSettings", {
                organizationId: user._id,
                isActive: true,
                greetMessage: "Hi! How can I help you today?",
                defaultSuggestions: {
                    suggestion1: "",
                    suggestion2: "",
                    suggestion3: "",
                },
                vapiSettings: {},
            });
        }
    },
});

export const updateIsActive = mutation({
    args: {
        isActive: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError({ message: "Unauthorized User", code: "unauthorized" });
        }

        let user = await ctx.db
            .query("users")
            .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
            .first();
        if (!user) {
            const userId = await ctx.db.insert("users", {
                name: identity.name ?? "User",
                email: identity.email!.toLowerCase(),
                createdAt: Date.now(),
            });
            user = await ctx.db.get(userId);
            if (!user) throw new ConvexError({ message: "User not found", code: "not_found" });
        }

        const existing = await ctx.db
            .query("widgetSettings")
            .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { isActive: args.isActive });
        } else {
            throw new ConvexError({ message: "Widget settings not found. Save your settings first.", code: "not_found" });
        }
    },
});
