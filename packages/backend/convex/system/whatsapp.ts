import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { internalMutation, internalQuery } from "../_generated/server";
import { SESSION_DURATION_MS } from "../constants";
import { supportAgent } from "./ai/agents/supportAgent";

const whatsappEmail = (from: string) => `whatsapp:${from}@whatsapp.local`;

export const getByOrganizationId = internalQuery({
  args: {
    organizationId: v.id("users"),
  },
  handler: async (ctx, { organizationId }) => {
    return await ctx.db
      .query("whatsappConfigs")
      .withIndex("byOrganizationId", (q) =>
        q.eq("organizationId", organizationId)
      )
      .unique();
  },
});

export const getByVerifyToken = internalQuery({
  args: {
    verifyToken: v.string(),
  },
  handler: async (ctx, { verifyToken }) => {
    return await ctx.db
      .query("whatsappConfigs")
      .withIndex("byVerifyToken", (q) => q.eq("verifyToken", verifyToken))
      .unique();
  },
});

export const getByPhoneNumberId = internalQuery({
  args: {
    phoneNumberId: v.string(),
  },
  handler: async (ctx, { phoneNumberId }) => {
    return await ctx.db
      .query("whatsappConfigs")
      .withIndex("byPhoneNumberId", (q) =>
        q.eq("phoneNumberId", phoneNumberId)
      )
      .unique();
  },
});

export const upsertConfig = internalMutation({
  args: {
    organizationId: v.id("users"),
    phoneNumberId: v.string(),
    businessPhoneNumber: v.optional(v.string()),
    verifyToken: v.string(),
    secretName: v.string(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("whatsappConfigs")
      .withIndex("byOrganizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        phoneNumberId: args.phoneNumberId,
        businessPhoneNumber: args.businessPhoneNumber,
        verifyToken: args.verifyToken,
        secretName: args.secretName,
        isEnabled: args.isEnabled,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("whatsappConfigs", {
      organizationId: args.organizationId,
      phoneNumberId: args.phoneNumberId,
      businessPhoneNumber: args.businessPhoneNumber,
      verifyToken: args.verifyToken,
      secretName: args.secretName,
      isEnabled: args.isEnabled,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setEnabled = internalMutation({
  args: {
    organizationId: v.id("users"),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, { organizationId, isEnabled }) => {
    const config = await ctx.db
      .query("whatsappConfigs")
      .withIndex("byOrganizationId", (q) =>
        q.eq("organizationId", organizationId)
      )
      .unique();

    if (!config) {
      throw new Error("WhatsApp configuration not found");
    }

    await ctx.db.patch(config._id, {
      isEnabled,
      updatedAt: Date.now(),
    });
  },
});

export const ensureConversationForSender = internalMutation({
  args: {
    organizationId: v.id("users"),
    from: v.string(),
    profileName: v.optional(v.string()),
  },
  handler: async (ctx, { organizationId, from, profileName }) => {
    const email = whatsappEmail(from);
    const now = Date.now();

    let session = await ctx.db
      .query("contact_sessions")
      .withIndex("byOrganizationIdAndEmail", (q) =>
        q.eq("organizationId", organizationId).eq("email", email)
      )
      .unique();

    if (!session) {
      const sessionId = await ctx.db.insert("contact_sessions", {
        organizationId,
        name: profileName || `WhatsApp ${from}`,
        email,
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS,
        metadata: {
          source: "whatsapp",
          platform: "whatsapp",
          whatsappFrom: from,
          whatsappName: profileName,
        },
      });

      session = await ctx.db.get(sessionId);
    } else if (session.expiresAt < now) {
      await ctx.db.patch(session._id, {
        expiresAt: now + SESSION_DURATION_MS,
      });
      session = await ctx.db.get(session._id);
    }

    if (!session) {
      throw new Error("Could not create WhatsApp contact session");
    }

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("byContactSessionId", (q) =>
        q.eq("contactSessionId", session!._id)
      )
      .order("desc")
      .collect();

    const existing = conversations.find((conversation) =>
      conversation.status === "unresolved" ||
      conversation.status === "escalated"
    );

    if (existing) {
      return {
        contactSessionId: session._id,
        threadId: existing.threadId,
        conversationId: existing._id,
        status: existing.status,
      };
    }

    const { threadId } = await supportAgent.createThread(ctx, {
      userId: session._id.toString(),
    });

    await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        role: "assistant",
        content: "WhatsApp conversation started.",
      },
    });

    const conversationId = await ctx.db.insert("conversations", {
      contactSessionId: session._id as Id<"contact_sessions">,
      threadId,
      status: "unresolved",
      createdAt: now,
      organizationId,
    });

    return {
      contactSessionId: session._id,
      threadId,
      conversationId,
      status: "unresolved" as const,
    };
  },
});
