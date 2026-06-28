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

const TEMPORARY_AI_ERROR_MESSAGE =
  "I'm having trouble answering automatically right now. Please try again in a moment.";

/**
 * Creates a new message in a conversation.
 *
 * Flow:
 * 1. Validate session is active & not expired
 * 2. Find conversation by threadId
 * 3. Ownership check (session must match conversation)
 * 4. Block messages on resolved conversations
 * 5. Refresh session TTL
 * 6. Check subscription — gate AI response
 * 7a. AI path: call supportAgent.generateText with prompt (agent saves user msg internally)
 *     On failure: ensure user msg + error reply are both in thread
 * 7b. Invalid subscription: save user msg + inform customer AI is unavailable
 * 7c. Escalated: save user msg only (operator will reply)
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

    // 5. Keep the session alive
    await ctx.runMutation(internal.system.contactSessions.refresh, {
      contactSessionId,
    });

    // 6. Check subscription — gate AI response
    const subscription = await ctx.runQuery(internal.system.subscription.getOne, {
      organizationId: session.organizationId,
    });

    // Grace period: no subscription record = treat as valid (new account)
    const isSubscriptionValid =
      !subscription ||
      subscription.status === "active" ||
      subscription.status === "trialing";

    const shouldTriggerAgent =
      conversation.status === "unresolved" && isSubscriptionValid;

    // ─────────────────────────────────────────────────────────────────────────
    // 7a. AI path
    // ─────────────────────────────────────────────────────────────────────────
    if (shouldTriggerAgent) {
      try {
        // Use `prompt:` so the agent saves the user message internally as part of
        // its atomic action — no manual pre-save needed here (avoids duplicates).
        await supportAgent.generateText(
          ctx,
          { threadId },
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
        console.error("Support agent generation failed:", error);

        // On failure: the agent may or may not have persisted the user message.
        // Check the thread to decide what recovery is needed.
        const lastMessages = await ctx.runQuery(
          components.agent.messages.listMessagesByThreadId,
          {
            threadId,
            order: "desc",
            paginationOpts: { numItems: 2, cursor: null },
          }
        );
        const messages = lastMessages?.page ?? [];

        // Check if user message was saved (agent might have saved it before crashing)
        const userMessageSaved = messages.some(
          (m: any) =>
            (m.message?.role ?? m.role) === "user" &&
            ((m.message?.content ?? m.text) === prompt)
        );

        if (!userMessageSaved) {
          // Agent crashed before saving the user message — save it now
          await saveMessage(ctx, components.agent, {
            threadId,
            message: { role: "user", content: prompt },
          });
        }

        // Now handle the failed assistant response
        const latestMessage = messages[0];
        if (latestMessage && latestMessage.status === "failed") {
          // Patch the failed pending message to a clean error reply
          await ctx.runMutation(components.agent.messages.updateMessage, {
            messageId: latestMessage._id,
            patch: {
              status: "success",
              message: {
                role: "assistant",
                content: TEMPORARY_AI_ERROR_MESSAGE,
              },
            },
          });
        } else {
          await saveMessage(ctx, components.agent, {
            threadId,
            message: {
              role: "assistant",
              content: TEMPORARY_AI_ERROR_MESSAGE,
            },
          });
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // 7b. Invalid subscription on unresolved conversation
    // ─────────────────────────────────────────────────────────────────────────
    else if (conversation.status === "unresolved" && !isSubscriptionValid) {
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: { role: "user", content: prompt },
      });
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: {
          role: "assistant",
          content:
            "Our AI support is temporarily unavailable. Please try again later or contact us directly.",
        },
      });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // 7c. Escalated — human operator will reply, just archive the message
    // ─────────────────────────────────────────────────────────────────────────
    else {
      await saveMessage(ctx, components.agent, {
        threadId: conversation.threadId,
        message: { role: "user", content: prompt },
      });
    }
  },
});

/**
 * Retrieves messages for a conversation (widget-facing).
 *
 * Filters out "pending" messages so customers never see the
 * `??` placeholder that @convex-dev/agent creates while the AI
 * is generating a response. The pending message is replaced with
 * the real response once generation completes.
 */
export const getMany = query({
  args: {
    threadId: v.string(),
    contactSessionId: v.id("contact_sessions"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, contactSessionId, paginationOpts }) => {
    // Validate session
    const session = await ctx.db.get(contactSessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    const result = await supportAgent.listMessages(ctx, { threadId, paginationOpts });

    // BUG FIX: We cannot filter `result.page` because changing the array length 
    // breaks Convex's usePaginatedQuery cursor logic, causing the UI to freeze and stop updating.
    // Instead, we map over the messages and replace any "pending" message with a nice placeholder.
    const mappedMessages = result.page.map((msg: any) => {
      if (msg.status === "pending") {
        return {
          ...msg,
          // Replace empty content with a nice typing indicator so the UI doesn't show "??"
          message: {
            role: "assistant",
            content: "...",
          },
          text: "...",
        };
      }
      return msg;
    });

    return {
      ...result,
      page: mappedMessages,
    };
  },
});
