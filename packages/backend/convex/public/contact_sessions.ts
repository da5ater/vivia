/**
 * Public Contact Session Handlers
 * 
 * This file handles "contact sessions", which are temporary authentication 
 * sessions for people who use the chat widget. When a customer enters their 
 * name and email to start a chat, we create a session for them so they can 
 * keep talking without having to log in every time.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { SESSION_DURATION_MS } from "../constants";

/**
 * Arguments required to create a new contact session.
 * Includes user info (name, email) and technical metadata (browser, URL, etc.).
 */
const createArgs = {
  slug: v.string(),
  name: v.string(),
  email: v.string(),
  metadata: v.optional(
    v.object({
      userAgent: v.optional(v.string()),
      referrer: v.optional(v.string()),
      source: v.optional(v.string()),
      language: v.optional(v.string()),
      platform: v.optional(v.string()),
      cookieEnabled: v.optional(v.boolean()),
      currentUrl: v.optional(v.string()),
      timezone: v.string(),
    })
  ),
};

/**
 * Creates a new session for a user visiting the chat widget.
 * 
 * This is called when a customer first fills out the contact form in the widget.
 * It links them to the correct organization (based on the 'slug') and sets
 * an expiration time for their session.
 * 
 * Simple Example:
 * A customer visits your site, types their name "John" and email "john@example.com".
 * This function creates a "pass" (session) for John that lets him chat for a few hours.
 * 
 * @param slug - The unique name of the company/organization (e.g., "acme-corp").
 * @param name - The customer's name.
 * @param email - The customer's email address.
 * @returns The ID of the newly created session.
 */
export const createContactSession = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    const slug = args.slug.trim().toLowerCase();

    // 1. Look up the organization (the "user" of our platform) by their unique slug
    const org = await ctx.db
      .query("users")
      .withIndex("bySlug", (q) => q.eq("slug", slug))
      .first();

    if (!org) {
      throw new Error(`Organization with slug '${slug}' not found.`);
    }

    // 2. Check if the organization has disabled their chat widget
    const settings = await ctx.db
      .query("widgetSettings")
      .withIndex("byOrganizationId", (q) => q.eq("organizationId", org._id))
      .first();

    if (settings && settings.isActive === false) {
      throw new Error("This chat is currently unavailable.");
    }

    // 3. Set the session timing (start now, expire in X hours)
    const createdAt = Date.now();
    const expiresAt = createdAt + SESSION_DURATION_MS;

    // 4. Save the session details
    return await ctx.db.insert("contact_sessions", {
      organizationId: org._id,
      name: args.name,
      email: args.email,
      createdAt,
      expiresAt,
      metadata: args.metadata,
    });
  },
});

/**
 * Checks if a session is still valid (exists and hasn't expired).
 * 
 * This is used by the frontend to see if it should show the chat history 
 * or ask the user to fill out the contact form again.
 * 
 * Simple Example:
 * When John refreshes the page, the widget checks if his "pass" (session) is 
 * still good. If it is, he can keep chatting. If not, he has to sign in again.
 * 
 * @param contactSessionId - The ID of the session to check.
 * @param slug - Optional organization slug to ensure the session belongs to the right company.
 * @returns An object indicating if the session is valid, and why if it's not.
 */
export const validate = mutation({
  args: {
    contactSessionId: v.id("contact_sessions"),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Fetch the session from the database
    const contactSession = await ctx.db.get(args.contactSessionId);
    if (!contactSession) {
      return {
        valid: false,
        reason: "Contact session not found",
      };
    }

    // 2. Check if the session has expired
    if (contactSession.expiresAt < Date.now()) {
      return {
        valid: false,
        reason: "Contact session has expired",
      };
    }

    // 3. (Optional) Double-check that this session belongs to the organization we expect
    if (args.slug) {
      const slug = args.slug.trim().toLowerCase();
      const org = await ctx.db
        .query("users")
        .withIndex("bySlug", (q) => q.eq("slug", slug))
        .first();

      if (!org || contactSession.organizationId !== org._id) {
        return {
          valid: false,
          reason: "Contact session belongs to a different organization",
        };
      }
    }

    return {
      valid: true,
      contactSession,
    };
  },
});
