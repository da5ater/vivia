import { google } from "@ai-sdk/google";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";

// Define the agent
export const supportAgent = new Agent(components.agent, {
  // Define the model and provider
  // The Google provider automatically uses the GOOGLE_GENERATIVE_AI_API_KEY from your env variables
  name: "supportAgent",
  languageModel: google("gemini-2.5-flash"),

  // Initial System Prompt
  instructions: "You are a customer support agent.",
});
