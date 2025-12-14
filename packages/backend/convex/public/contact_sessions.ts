import { v } from "convex/values";
import { mutation } from "../_generated/server";

const createArgs = {
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

export const createContactSession = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    const expiresAt = createdAt + SESSION_DURATION_MS;
    return await ctx.db.insert("contact_sessions", {
      name: args.name,
      email: args.email,
      createdAt,
      expiresAt,
      metadata: args.metadata,
    });
  },
});

export const validate = mutation({
  args: {
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, args) => {
    const contactSession = await ctx.db.get(args.contactSessionId);
    if (!contactSession) {
      return {
        valid: false,
        reason: "Contact session not found",
      };
    }
    if (contactSession.expiresAt < Date.now()) {
      return {
        valid: false,
        reason: "Contact session has expired",
      };
    } else {
      return {
        valid: true,
        contactSession,
      };
    }
  },
});
