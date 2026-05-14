/**
 * User and Organization Handlers
 * 
 * This file manages the "users" of our platform (the companies/organizations).
 * It handles account creation, syncing user data from the authentication 
 * provider (Clerk), and managing organization settings like their "slug" 
 * (their unique URL identifier).
 */

import { query, mutation, internalQuery } from "./_generated/server";
import { ConvexError, v } from "convex/values";

/**
 * Finds a user/organization by their email address.
 * 
 * @param email - The email address to search for.
 * @returns The user record or null if not found.
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", email.toLowerCase()))
      .unique();
  },
});

/**
 * Retrieves all users in the system.
 * 
 * @returns A list of all user records.
 */
export const getMany = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Gets the current logged-in user's information.
 * 
 * This function uses the authentication context to find who is currently 
 * logged in and then fetches their record from our database.
 * 
 * Simple Example:
 * When you log in to the dashboard, the app calls this to get your name
 * and see which organization you belong to.
 * 
 * @returns The current user's record or null if they aren't logged in.
 */
export const getMyUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Unauthorized", code: "unauthorized" });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    // Return null instead of throwing — user row may not exist yet
    if (!user) {
      return null;
    }

    return user;
  },
});

/** 
 * Internal query used by background tasks (like payment webhooks).
 * 
 * This helps link a payment (from Stripe) to a user in our database using 
 * a unique "tokenIdentifier" (their Clerk ID).
 * 
 * @param tokenIdentifier - The unique ID from the auth provider.
 */
export const getByTokenIdentifier = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }) => {
    return await ctx.db
      .query("users")
      .withIndex("byTokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier)
      )
      .unique();
  },
});

/**
 * Manually creates a new user.
 * 
 * @param name - The user's name.
 * @param email - The user's email address.
 * @returns The ID of the newly created user.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email.toLowerCase(),
      createdAt: now,
    });
    return userId;
  },
});

/**
 * Synchronizes the logged-in user's data with our database.
 * 
 * When a user logs in via Clerk, we check if they already exist in our DB.
 * If they do, we update their info (like their tokenIdentifier).
 * If they don't, we create a new account for them automatically.
 * 
 * Simple Example:
 * You sign up for the first time. Clerk says "Welcome!". This function then
 * says "Cool, let me make a spot for you in our database too."
 * 
 * @returns The ID of the user (either existing or newly created).
 */
export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get the authenticated identity from Clerk
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Unauthorized", code: "unauthorized" });
    }

    // 2. Check if we already have this user in our database
    const existingUser = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    if (existingUser) {
      // 3a. Update existing user's ID if it's missing (backfill)
      if (!existingUser.tokenIdentifier) {
        await ctx.db.patch(existingUser._id, {
          tokenIdentifier: identity.subject,
        });
      }
      
      // 3b. If they have a pending subscription, link it to their account
      const pendingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("bySubscriberId", (q) =>
          q.eq("subscriberId", identity.subject)
        )
        .unique();
      if (pendingSubscription && !pendingSubscription.organizationId) {
        await ctx.db.patch(pendingSubscription._id, {
          organizationId: existingUser._id,
        });
      }
      return existingUser._id;
    }

    // 4. If they are new, create a new user record
    const userId = await ctx.db.insert("users", {
      name: identity.name ?? "User",
      email: identity.email!.toLowerCase(),
      tokenIdentifier: identity.subject, // Clerk user ID (e.g. "user_xxx")
      createdAt: Date.now(),
    });

    // 5. Link any subscription that was started before they finished signing up
    const pendingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("bySubscriberId", (q) => q.eq("subscriberId", identity.subject))
      .unique();
    if (pendingSubscription && !pendingSubscription.organizationId) {
      await ctx.db.patch(pendingSubscription._id, {
        organizationId: userId,
      });
    }

    return userId;
  },
});

/**
 * Updates the organization's "slug" (their custom URL).
 * 
 * A slug is a short, URL-friendly name like "acme-support".
 * This function handles changing it while making sure it's unique and safe.
 * 
 * Simple Example:
 * You want your chat to be at `vivia.chat/my-company`. You type "my-company" 
 * into settings, and this function checks if anyone else has it before saving.
 * 
 * @param slug - The new desired slug.
 * @returns The ID of the updated user.
 */
export const updateSlug = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, { slug }) => {
    // 1. Verify permissions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Unauthorized", code: "unauthorized" });
    }

    // 2. Validate the slug format (lowercase, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new ConvexError({
        message:
          "Slug may only contain lowercase letters, numbers, and hyphens",
        code: "invalid_slug",
      });
    }

    // 3. Security: Don't let people pretend to be 'vivia'
    if (slug.toLowerCase() === "vivia") {
      throw new ConvexError({
        message: "The slug 'vivia' is reserved and cannot be used",
        code: "slug_reserved",
      });
    }

    // 4. Find the user record
    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "not_found" });
    }

    // 5. Protection: If you already HAVE 'vivia', you can't give it away (or change it)
    if (user.slug === "vivia") {
      throw new ConvexError({
        message: "The 'vivia' slug is protected and cannot be changed",
        code: "slug_protected",
      });
    }

    // 6. Rate Limit: Only allow one change every 24 hours
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

    // 7. Uniqueness: Make sure no one else is already using this slug
    const existing = await ctx.db
      .query("users")
      .withIndex("bySlug", (q) => q.eq("slug", slug))
      .unique();

    if (existing && existing._id !== user._id) {
      throw new ConvexError({
        message: "This slug is already taken",
        code: "slug_taken",
      });
    }

    // 8. Success: Update the slug and record the time of change
    await ctx.db.patch(user._id, {
      slug,
      lastSlugChangedAt: Date.now(),
    });
    return user._id;
  },
});

//----------------------------------------------------------------------------------------
