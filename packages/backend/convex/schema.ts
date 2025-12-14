import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // store createdAt as a UNIX timestamp (milliseconds) using a number validator
    createdAt: v.number(),
  })
    .index("byEmail", ["email"])
    .index("byCreatedAt", ["createdAt"]),

  contact_sessions: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()),
        referrer: v.optional(v.string()),
        source: v.optional(v.string()),
        language: v.optional(v.string()),
        platform: v.optional(v.string()),
        cookieEnabled: v.optional(v.boolean()),
        currentUrl: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })
    ),
  })
    .index("byEmail", ["email"])
    .index("byCreatedAt", ["createdAt"]),

  conversations: defineTable({
    contactSessionId: v.id("contact_sessions"),
    threadId: v.string(),
    status: v.union(
      v.literal("unresolved"),
      v.literal("resolved"),
      v.literal("escalated")
    ),
    createdAt: v.number(),
  })
    .index("byContactSessionId", ["contactSessionId"])
    .index("byStatus", ["status"])
    .index("byThreadId", ["threadId"]),
});

export default schema;
