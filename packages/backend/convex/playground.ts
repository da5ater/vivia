import { definePlaygroundAPI } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { supportAgent } from "./system/ai/agents/supportAgent";
import { query } from "./_generated/server";

/**
 * Here we expose the API so the frontend can access it.
 * Authorization is handled by passing up an apiKey that can be generated
 * on the dashboard or via CLI via:
 * npx convex run --component agent apiKeys:issue
 */
export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [supportAgent],
});

export const checkAgentConditions = query({
    args: {},
    handler: async (ctx) => {
      const orgs = await ctx.db.query("users").collect();
      const orgId = orgs[0]?._id;
      if (!orgId) return "No org found";

      const subscription = await ctx.db.query("subscriptions")
        .withIndex("byOrganizationId", (q) => q.eq("organizationId", orgId))
        .first();

      const conversations = await ctx.db.query("conversations")
        .order("desc")
        .take(5);

      return {
        subscriptionStatus: subscription?.status || "none",
        conversationStatuses: conversations.map(c => ({ id: c._id, status: c.status }))
      };
    },
  });