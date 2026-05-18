import { action, internalQuery } from "../_generated/server.js";
import { ConvexError, v } from "convex/values";
import { generateText } from "ai";
import type { LanguageModel } from "ai";
import { getModel } from "../system/ai/models.js";
import { internal } from "../_generated/api.js";

async function requireCurrentUserAction(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ message: "Unauthorized", code: "unauthorized" });
  }
  return identity;
}

export const getRecentSummaries = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (!user) return "";

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
      .order("desc")
      .take(50);

    const summaries = conversations
      .filter((c) => c.summary)
      .map((c) => `- [${c.tags?.join(", ") || "No tags"}]: ${c.summary}`)
      .join("\n");

    return summaries;
  },
});

export const generateOrgInsights = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const identity = await requireCurrentUserAction(ctx);

    const summaries: string = await ctx.runQuery(internal.private.insights.getRecentSummaries, {
      email: identity.email!,
    });

    if (!summaries || summaries.trim() === "") {
      return "Not enough conversation data to generate insights. Please resolve more conversations so the AI can summarize them and generate statistics.";
    }

    const prompt: string = `
You are an expert customer experience and support analyst for an organization.
We have collected the following summaries of recent support conversations (with their tags):

${summaries}

Based on these summaries, provide actionable insights and tips for the organization to enhance the user experience, improve the product, or handle customer needs more effectively.
Use markdown format with clearly separated sections (e.g., "General Insights", "Key Recurring Issues", "Actionable Tips"). Do not include any JSON. 
Provide a very brief 1-2 sentence high-level summary at the beginning.
Make sure your suggestions are highly actionable and specific to the data provided. Keep the tone professional, objective, and encouraging.
`;

    try {
      const response = await generateText({
        model: getModel("summarizer") as LanguageModel,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return response.text;
    } catch (error) {
      console.error("Error generating insights:", error);
      return "An error occurred while generating insights. The AI service might be temporarily unavailable. Please try again later.";
    }
  },
});
