/**
 * Public Message Handlers
 * 
 * This file contains the public-facing API endpoints for managing messages
 * within a conversation. It handles creating new messages (which might trigger
 * the AI support agent) and fetching message history.
 */

import { v, ConvexError } from "convex/values";
import { action, query } from "../_generated/server.js";
import { internal } from "../_generated/api";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { paginationOptsValidator } from "convex/server";
import { escalateConversation } from "../system/ai/tools/escalateConversation.js";
import { resolveConversation } from "../system/ai/tools/resolveConversation.js";
import { components } from "../_generated/api.js";
import { saveMessage } from "@convex-dev/agent";
import { search } from "../system/ai/tools/search.js";

/**
 * Creates a new message in a conversation.
 * 
 * This action is triggered when a user sends a message. It performs several checks:
 * 1. Validates that the contact session is still active and valid.
 * 2. Ensures the conversation belongs to the current session.
 * 3. Checks if the conversation is already resolved (if so, no more messages allowed).
 * 4. Refreshes the session timer.
 * 5. Checks if the organization has an active subscription.
 * 6. If everything is valid, it either triggers the AI Support Agent to generate a response
 *    or simply saves the message if the agent shouldn't be triggered.
 * 
 * Simple Example:
 * Imagine a customer types "How do I reset my password?". This function receives that text,
 * checks if they are logged in correctly, and then asks the AI to find the answer.
 * 
 * @param prompt - The text content of the message sent by the user.
 * @param threadId - The unique identifier for the chat thread.
 * @param contactSessionId - The ID of the current user's session.
 */
export const create = action({
  args: {
    prompt: v.string(),
    threadId: v.string(),
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { prompt, threadId, contactSessionId }) => {
    // 1. Verify the session exists and hasn't expired
    const session = await ctx.runQuery(internal.system.contactSessions.getOne, {
      contactSessionId,
    });
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    // 2. Find the conversation by its thread ID
    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      { threadId }
    );
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    // 3. Ensure the user has permission to post to this conversation
    if (conversation.contactSessionId !== contactSessionId) {
      throw new ConvexError({
        message: "Access to this conversation is unauthorized",
        code: "unauthorized",
      });
    }

    // 4. Don't allow messages in closed/resolved conversations
    if (conversation.status === "resolved") {
      throw new ConvexError("Cannot add messages to a resolved conversation");
    }

    // 5. Keep the session alive by updating its 'last active' timestamp
    await ctx.runMutation(internal.system.contactSessions.refresh, {
      contactSessionId: contactSessionId,
    });

    // 6. Check subscription status to see if AI features are available
    const subscription = await ctx.runQuery(internal.system.subscription.getOne, {
      organizationId: session.organizationId,
    });
    
    // We allow the agent if the subscription is active, trialing, or if no subscription record exists yet (grace period)
    const isSubscriptionValid = !subscription || subscription.status === "active" || subscription.status === "trialing";
    
    const shouldTriggerAgent =
      conversation.status === "unresolved" && isSubscriptionValid;
      
    if (shouldTriggerAgent) {
      try {
        // Trigger the AI to generate a response using the support agent logic
        await supportAgent.generateText(
          ctx,
          {
            threadId,
          },
          {
            prompt,
            tools: {
              escalateConversation,
              resolveConversation,
              search,
            },
          } as any
        );
      } catch (error) {
        // If the AI fails, we automatically escalate to a human support agent
        console.error("Support agent generation failed:", error);
        await ctx.runMutation(internal.system.conversations.escalate, {
          threadId,
          customerMessage:
            "I'm having trouble answering automatically right now, so I've connected you with our support team. A team member will follow up here soon.",
        });
      }
    } else {
      // If AI shouldn't trigger (e.g. conversation already escalated), just save the user's message
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: {
          role: "user",
          content: prompt,
        },
      });
    }
  },
});

/**
 * Retrieves a list of messages for a specific conversation.
 * 
 * This query fetches the message history so it can be displayed in the chat UI.
 * It ensures the user is authorized to see these messages by checking their session.
 * 
 * Simple Example:
 * When you open a chat window, this function is used to load all the previous 
 * "hellos" and "how can I help you" messages so you can see the whole conversation.
 * 
 * @param threadId - The unique identifier for the chat thread.
 * @param contactSessionId - The ID of the current user's session.
 * @param paginationOpts - Options for loading messages in chunks (pagination).
 * @returns A paginated list of messages.
 */
export const getMany = query({
  args: {
    threadId: v.string(),
    contactSessionId: v.id("contact_sessions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, contactSessionId, paginationOpts }) => {
    // Check if the user's session is still valid
    const session = await ctx.db.get(contactSessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    // Fetch the messages using the support agent helper
    return await supportAgent.listMessages(ctx, { threadId, paginationOpts });
  },
});
