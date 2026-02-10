import { google } from "@ai-sdk/google";
import { createTool } from "@convex-dev/agent";
import { generateText } from "ai";
import z from "zod";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";
import rag from "../rag";
import { SEARCH_INTERPRETER_PROMPT } from "../constants";

const NAMESPACE = "default";

export const search = createTool({
    description: "Search for information in the knowledge base to help the user",
    args: z.object({
        query: z
            .string()
            .describe("The search query to find relevant info"),
    }),
    handler: async (ctx, { query }) => {
        if (!ctx.threadId) {
            return "Missing thread ID";
        }

        const conversation = await ctx.runQuery(
            internal.system.conversations.getByThreadId,
            { threadId: ctx.threadId }
        );

        if (!conversation) {
            return "Conversation not found";
        }

        const searchResults = await rag.search(ctx, {
            namespace: NAMESPACE,
            query: query,
            limit: 10,
        });

        const titles = searchResults.entries
            .map((e) => e.title)
            .filter((t) => t !== null)
            .join(", ");

        const contextText = `   
        Found results in: ${titles} 
        Here is the context:${searchResults.text}`;

        const response = await generateText({
            model: google.chat("gemini-2.5-flash"),
            messages: [
                {
                    role: "system",
                    content: SEARCH_INTERPRETER_PROMPT,
                },
                {
                    role: "user",
                    content: `User asked:${query} "\n\n Search results:${contextText}`,
                },
            ],
        });

        await supportAgent.saveMessages(ctx, {
            threadId: ctx.threadId,
            messages: [
                {
                    role: "assistant",
                    content: response.text,
                },
            ],
        });

        return response.text;
    },
});


