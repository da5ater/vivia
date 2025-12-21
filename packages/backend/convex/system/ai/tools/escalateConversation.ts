import { createTool } from "@convex-dev/agent";
import { internal } from "../../../_generated/api";
import z from "zod";

export const escalateConversation = createTool({
  description:
    "Escalate a conversation when the user requests to speak to a human or needs urgent assistance.",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      throw new Error("Thread ID is required to escalate a conversation.");
    }

    await ctx.runMutation(internal.system.conversations.escalate, {
      threadId: ctx.threadId,
    });

    return "Conversation escalated successfully.";
  },
});
