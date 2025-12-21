import { createTool } from "@convex-dev/agent";
import { internal } from "../../../_generated/api";
import z from "zod";

export const resolveConversation = createTool({
  description:
    "Resolve a conversation when the user is satisfied or asks to close.",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      throw new Error("Thread ID is required to resolve a conversation.");
    }

    await ctx.runMutation(internal.system.conversations.resolve, {
      threadId: ctx.threadId,
    });

    return "Conversation resolved successfully.";
  },
});
