import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * Centralized model configuration to easily swap models and manage quotas.
 */
export const MODELS: Record<"agent" | "interpreter" | "enhancer", LanguageModel> = {
    // Primary model for the support agent
    agent: google("gemini-2.5-flash-lite"),

    // Model for interpreting search results (can be cheaper/faster)
    interpreter: google("gemini-2.5-flash-lite"),

    // Model for enhancing operator messages
    enhancer: google("gemini-2.5-flash-lite"),
};
