import { google } from "@ai-sdk/google";

type ModelPurpose = "agent" | "interpreter" | "enhancer";

/**
 * Centralized model configuration to easily swap models and manage quotas.
 */
const MODEL_IDS: Record<ModelPurpose, Parameters<typeof google>[0]> = {
  // Primary model for the support agent
  agent: "gemini-2.5-flash-lite",

  // Model for interpreting search results (can be cheaper/faster)
  interpreter: "gemini-2.5-flash-lite",

  // Model for enhancing operator messages
  enhancer: "gemini-2.5-flash-lite",
};

export function getModel(purpose: ModelPurpose): unknown {
  return google(MODEL_IDS[purpose]);
}
