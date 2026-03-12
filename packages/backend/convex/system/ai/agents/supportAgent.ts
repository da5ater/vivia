import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { escalateConversation } from "../tools/escalateConversation";
import { resolveConversation } from "../tools/resolveConversation";
import { search } from "../tools/search";
import { SUPPORT_AGENT_PROMPT } from "../constants";

// Define the agent
export const supportAgent = new Agent(components.agent, {
  // Define the model and provider
  // The Google provider automatically uses the GOOGLE_GENERATIVE_AI_API_KEY from your env variables
  name: "supportAgent",
  languageModel: google("gemini-2.5-flash"),

  // Initial System Prompt
  instructions: SUPPORT_AGENT_PROMPT,
  tools: {
    escalateConversation,
    resolveConversation,
    search,
  },
});
