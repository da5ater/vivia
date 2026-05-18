import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

type ModelPurpose = "agent" | "interpreter" | "enhancer" | "summarizer";

/**
 * Centralized model configuration to easily swap models and manage quotas.
 */
export function getModel(purpose: ModelPurpose): unknown {
  switch (purpose) {
    case "agent":
      return google("gemini-2.5-flash");
    case "interpreter":
      return google("gemini-2.5-flash");
    case "enhancer":
      return google("gemini-2.5-flash-lite");
    case "summarizer":
      return groq("llama-3.1-8b-instant");
    default:
      throw new Error(`Unknown model purpose: ${purpose}`);
  }
}
