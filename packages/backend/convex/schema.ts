/**
 * Database Schema Definition
 * 
 * This file defines the structure of the data stored in the Convex database.
 * Think of it as a blueprint for our digital filing cabinet. It tells the 
 * system what tables exist (like "users" or "messages") and what kind of 
 * information each row in those tables should hold.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({

  /**
   * Subscriptions Table
   * 
   * Stores information about the payment status of organizations.
   * It tells us if a company has paid for the Pro plan or is still on a free trial.
   */
  subscriptions: defineTable({
    organizationId: v.optional(v.id("users")),
    subscriberId: v.optional(v.string()), // External ID from the payment provider (e.g., Stripe)
    status: v.string(), // e.g., "active", "trialing", "canceled"
  })
    .index("byOrganizationId", ["organizationId"])
    .index("bySubscriberId", ["subscriberId"]),

  /**
   * Widget Settings Table
   * 
   * Stores how the chat widget looks and behaves for each company.
   * This is where we save things like "What should the bot say first?".
   */
  widgetSettings: defineTable({
    organizationId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()), // Is the chat widget turned on?
    greetMessage: v.string(), // The first message the bot sends
    defaultSuggestions: v.object({
      suggestion1: v.string(),
      suggestion2: v.string(),
      suggestion3: v.string(),
    }),
    vapiSettings: v.object({
      assistantId: v.optional(v.string()), // ID for Voice AI integration
      phoneNumber: v.optional(v.string()),
    }),
  }).index("byOrganizationId", ["organizationId"]),

  /**
   * Users Table
   * 
   * Stores the main accounts for companies using our platform.
   * Each user record represents an organization that has signed up.
   */
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.optional(v.string()), // Secure ID from Clerk (authentication)
    slug: v.optional(v.string()), // The unique part of their URL (e.g., acme-corp)
    createdAt: v.number(), // When they joined (UNIX timestamp)
    lastSlugChangedAt: v.optional(v.number()),
  })
    .index("byEmail", ["email"])
    .index("bySlug", ["slug"])
    .index("byCreatedAt", ["createdAt"])
    .index("byTokenIdentifier", ["tokenIdentifier"]),

  /**
   * Contact Sessions Table
   * 
   * Stores temporary "logins" for people visiting a company's website.
   * When a customer uses the chat widget, we create a session for them here.
   */
  contact_sessions: defineTable({
    organizationId: v.optional(v.id("users")),
    name: v.string(), // The customer's name
    email: v.string(), // The customer's email
    createdAt: v.number(),
    expiresAt: v.number(), // When this session will automatically log out
    metadata: v.optional(
      v.object({
        userAgent: v.optional(v.string()), // Browser info
        referrer: v.optional(v.string()), // Where they came from
        source: v.optional(v.string()),
        language: v.optional(v.string()),
        platform: v.optional(v.string()),
        cookieEnabled: v.optional(v.boolean()),
        currentUrl: v.optional(v.string()),
        timezone: v.optional(v.string()),
        whatsappFrom: v.optional(v.string()),
        whatsappName: v.optional(v.string()),
        messengerId: v.optional(v.string()),
        messengerName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
      })
    ),
  })
    .index("byEmail", ["email"])
    .index("byOrganizationId", ["organizationId"])
    .index("byOrganizationIdAndEmail", ["organizationId", "email"])
    .index("byCreatedAt", ["createdAt"]),

  /**
   * WhatsApp Configs Table
   *
   * Stores non-secret WhatsApp Cloud API settings for each organization.
   * The access token itself is stored in the secret manager and referenced by
   * secretName so normal database reads never expose it.
   */
  whatsappConfigs: defineTable({
    organizationId: v.id("users"),
    phoneNumberId: v.string(),
    businessPhoneNumber: v.optional(v.string()),
    verifyToken: v.string(),
    secretName: v.string(),
    isEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byOrganizationId", ["organizationId"])
    .index("byPhoneNumberId", ["phoneNumberId"])
    .index("byVerifyToken", ["verifyToken"]),

  /**
   * Messenger Configs Table
   *
   * Stores non-secret Facebook Messenger API settings for each organization.
   * The access token itself is stored in the secret manager and referenced by
   * secretName so normal database reads never expose it.
   */
  messengerConfigs: defineTable({
    organizationId: v.id("users"),
    pageId: v.string(),
    pageName: v.optional(v.string()),
    verifyToken: v.string(),
    secretName: v.string(),
    isEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byOrganizationId", ["organizationId"])
    .index("byPageId", ["pageId"])
    .index("byVerifyToken", ["verifyToken"]),

  /**
   * Plugins Table
   * 
   * Stores configuration for external services (like Vapi).
   * It links organizations to their specific external service settings.
   */
  Plugins: defineTable({
    namespace: v.string(), // Usually the organization ID
    service: v.union(v.literal("vapi")), // Name of the service
    secretName: v.string(), // Reference to a secure secret
  })
    .index("byServiceAndNamespace", ["service", "namespace"])
    .index("bySecretName", ["secretName", "namespace"]),

  /**
   * Conversations Table
   * 
   * Groups a sequence of messages together.
   * It tracks if a customer's question has been answered or if a human needs to help.
   */
  conversations: defineTable({
    organizationId: v.optional(v.id("users")),
    contactSessionId: v.id("contact_sessions"),
    threadId: v.string(), // Unique ID for the AI's message thread
    status: v.union(
      v.literal("unresolved"), // Still being discussed
      v.literal("resolved"),   // Finished
      v.literal("escalated")   // Passed to a human support agent
    ),
    createdAt: v.number(),
    summary: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
    .index("byOrganizationId", ["organizationId"])
    .index("byOrganizationIdAndStatus", ["organizationId", "status"])
    .index("byContactSessionId", ["contactSessionId"])
    .index("byStatus", ["status"])
    .index("byThreadId", ["threadId"]),

  /**
   * Knowledge Sources Table
   * 
   * Stores connections to external dynamic knowledge bases like Google Sheets or Excel.
   * This tells the sync engine where to fetch data from and when it was last updated.
   */
  knowledgeSources: defineTable({
    organizationId: v.id("users"),
    type: v.union(
      v.literal("google_sheet_public"),
      v.literal("google_sheet_private"),
      v.literal("excel_upload")
    ),
    sourceUrl: v.optional(v.string()), // The original URL pasted by the user
    sourceId: v.string(), // Extracted ID (e.g., the Google Sheet ID)
    status: v.union(
      v.literal("active"),
      v.literal("syncing"),
      v.literal("error"),
      v.literal("paused")
    ),
    lastSyncedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byOrganizationId", ["organizationId"])
    .index("byType", ["type"])
    .index("byOrganizationIdAndType", ["organizationId", "type"]),
});

export default schema;
