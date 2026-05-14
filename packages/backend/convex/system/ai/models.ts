import { google } from "@ai-sdk/google";

/**
 * Centralized model configuration to easily swap models and manage quotas.
 */
export const MODELS = {
    // Primary model for the support agent
    agent: google("gemini-2.5-flash-lite"),

    // Model for interpreting search results (can be cheaper/faster)
    interpreter: google("gemini-2.5-flash-lite"),

    // Model for enhancing operator messages
    enhancer: google("gemini-2.5-flash-lite"),
};
