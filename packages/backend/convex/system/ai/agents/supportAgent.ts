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
  instructions: `You are a customer support agent.Use "resolveConversation" tool to resolve the conversation when the customer's issue has been addressed. Use "escalateConversation" tool to escalate the conversation to a human agent when you are unable to assist the customer effectively or user requests escalation or requests a human agent.`,
});
