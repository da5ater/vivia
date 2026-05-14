/**
 * Public Conversation Handlers
 * 
 * This file manages the "conversations" between users and the support system.
 * A conversation is essentially a container for a thread of messages.
 * It tracks the status of the interaction (e.g., unresolved, escalated, or resolved).
 */

import { mutation, query } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent.js";
import { saveMessage, vMessageDoc } from "@convex-dev/agent";
import { components, internal } from "../_generated/api.js";
import { paginationOptsValidator } from "convex/server";
import { MessageDoc } from "@convex-dev/agent";

/**
 * Fetches multiple conversations for a given user session.
 * 
 * This is used to show a list of previous chats the user has had.
 * It also fetches the very last message of each conversation to show a preview.
 * 
 * Simple Example:
 * If you've chatted with support three times this week, this function returns
 * those three chats so you can click on them and see what was discussed.
 * 
 * @param contactSessionId - The ID of the current user's session.
 * @param paginationOpts - Options for loading conversations in chunks.
 * @returns A list of conversations with their last message preview.
 */
export const getMany = query({
  args: {
    contactSessionId: v.id("contact_sessions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { contactSessionId, paginationOpts }) => {
    // 1. Verify the session is still active
    const session = await ctx.db
      .query("contact_sessions")
      .withIndex("by_id", (q) => q.eq("_id", contactSessionId))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    // 2. Query all conversations linked to this session
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("byContactSessionId", (q) =>
        q.eq("contactSessionId", contactSessionId)
      )
      .order("desc")
      .paginate(paginationOpts);

    // 3. For each conversation, find the last message to show a preview in the UI
    const conversationWithLastMessage = await Promise.all(
      conversations.page.map(async (conversation) => {
        let lastMessage: MessageDoc | null = null;

        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        if (messages.page.length > 0) {
          lastMessage = messages.page[0] ?? null;
        }

        return {
          _id: conversation._id,
          status: conversation.status,
          threadId: conversation.threadId,
          lastMessage,
        };
      })
    );

    return {
      ...conversations,
      page: conversationWithLastMessage,
    };
  },
});

/**
 * Starts a brand new conversation.
 * 
 * This mutation creates a new thread in the AI system and inserts a new
 * conversation record in the database. It also sends an initial "Greeting"
 * message from the assistant based on the organization's settings.
 * 
 * Simple Example:
 * When a user clicks "Start New Chat" in the widget, this function is called.
 * It sets up the chat and makes the bot say "Hello, how can I help you?".
 * 
 * @param contactSessionId - The ID of the user starting the chat.
 * @returns The ID of the newly created conversation.
 */
export const create = mutation({
  args: {
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { contactSessionId }) => {
    const now = Date.now();

    // 1. Validate the session
    const session = await ctx.db.get(contactSessionId);
    if (!session) {
      throw new ConvexError("Contact session not found");
    }
    if (session.expiresAt < now) {
      throw new ConvexError("Contact session has expired");
    }

    // 2. Keep the session alive
    await ctx.runMutation(internal.system.contactSessions.refresh, {
      contactSessionId,
    });

    // 3. Get the greeting message from the widget settings
    const widgetSettings = await ctx.db
      .query("widgetSettings")
      .withIndex("byOrganizationId", (q) =>
        q.eq("organizationId", session.organizationId)
      )
      .unique();

    const greetMessage = widgetSettings?.greetMessage || "Hello, how can I help you today?";

    // 4. Create a new AI thread for this conversation
    const { threadId } = await supportAgent.createThread(ctx, {
      userId: contactSessionId.toString(),
    });

    // 5. Save the initial greeting message from the assistant
    await saveMessage(ctx, components.agent, {
      threadId,
      message: {
        role: "assistant",
        content: greetMessage,
      },
    });

    // 6. Record the new conversation in our database
    const conversationId = await ctx.db.insert("conversations", {
      contactSessionId,
      threadId,
      status: "unresolved",
      createdAt: now,
      organizationId: session.organizationId, // scoped to the org from the session
    });

    return conversationId;
  },
});

/**
 * Retrieves details for a single specific conversation.
 * 
 * Used when a user clicks on a specific chat from their history to open it.
 * It checks permissions to make sure the user is allowed to see this chat.
 * 
 * @param conversationId - The ID of the conversation to fetch.
 * @param contactSessionId - The ID of the user's current session.
 * @returns The conversation details or null if not found/unauthorized.
 */
export const getOne = query({
  args: {
    conversationId: v.id("conversations"),
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { conversationId, contactSessionId }) => {
    // 1. Validate session
    const session = await ctx.db.get(contactSessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    // 2. Fetch the conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      return null;
    }

    // 3. Authorization check: does this conversation belong to this session?
    if (conversation.contactSessionId !== contactSessionId) {
      return null;
    }

    return {
      _id: conversationId,
      status: conversation.status,
      threadId: conversation.threadId,
    };
  },
});
