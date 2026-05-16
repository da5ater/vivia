import { action } from "./_generated/server.js";
import { v } from "convex/values";
import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { supportAgent } from "./system/ai/agents/supportAgent.js";
import { getModel } from "./system/ai/models.js";
import { internal } from "./_generated/api";

const SUMMARIZE_PROMPT = `
You are a summarization assistant for support conversations.
Read the transcript and return valid JSON only, with exactly two fields:
{
  "summary": "<short summary in 1-2 sentences>",
  "tags": ["tag1", "tag2"]
}
Tags should be short topic labels in lowercase without punctuation.
`;

async function getFullThreadTranscript(ctx: Parameters<typeof supportAgent.listMessages>[0], threadId: string) {
  const messages: Array<{ role: string; content: string }> = [];
  let cursor: string | null = null;

  while (true) {
    const page = await supportAgent.listMessages(ctx, {
      threadId,
      paginationOpts: { numItems: 50, cursor },
    });

    messages.push(...page.page);
    if (page.isDone) break;
    cursor = page.continueCursor;
  }

  return messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");
}

export const summarizeConversation = action({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    const transcript = await getFullThreadTranscript(ctx, threadId);

    const prompt = `
${SUMMARIZE_PROMPT}

Transcript:
${transcript}
`;

    const response = await generateText({
      model: getModel("enhancer") as LanguageModel,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.text.trim();

    let parsed: { summary?: string; tags?: string[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("Unable to parse summarization response");
      }
      parsed = JSON.parse(match[0]);
    }

    const summary = parsed.summary?.trim() ?? "";
    const tags =
      Array.isArray(parsed.tags) && parsed.tags.every((tag) => typeof tag === "string")
        ? parsed.tags.map((tag) => tag.trim()).filter(Boolean)
        : [];

    await ctx.runMutation(internal.system.conversations.saveSummary, {
      threadId,
      summary: summary || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    return { summary, tags };
  },
});