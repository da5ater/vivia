import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";

// Parse keys from environment variables (handles comma-separated lists or fallback to single key)
const getGeminiKeys = () => {
  const keysStr = 
    process.env.GEMINI_API_KEYS || 
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    "";
  return keysStr.split(",").map(k => k.trim()).filter(Boolean);
};

const getGroqKeys = () => {
  const keysStr = 
    process.env.GROQ_API_KEYS || 
    process.env.GROQ_API_KEY || 
    "";
  return keysStr.split(",").map(k => k.trim()).filter(Boolean);
};

let geminiIndex = 0;
let groqIndex = 0;

type ModelPurpose = "agent" | "interpreter" | "enhancer" | "summarizer";

/**
 * Creates a language model wrapper that automatically rotates through a pool of 
 * API keys (round-robin) and fails over to alternative keys/providers if a key
 * gets rate-limited or exhausted.
 */
function createPooledModel(modelName: string, preferredProvider: "google" | "groq") {
  const tryCall = async (methodName: "doGenerate" | "doStream", options: any) => {
    const geminiKeys = getGeminiKeys();
    const groqKeys = getGroqKeys();

    // 1. Try Google Gemini Keys first if preferred
    if (preferredProvider === "google" && geminiKeys.length > 0) {
      const startIndex = geminiIndex % geminiKeys.length;
      for (let i = 0; i < geminiKeys.length; i++) {
        const currentIdx = (startIndex + i) % geminiKeys.length;
        const key = geminiKeys[currentIdx];
        
        try {
          const provider = createGoogleGenerativeAI({ apiKey: key });
          const model = provider(modelName);
          
          // Advance index for next call
          if (i === 0) geminiIndex++;
          
          return await model[methodName](options);
        } catch (error) {
          console.warn(`Gemini key rotation failed (key ${currentIdx + 1}/${geminiKeys.length}), trying next...`, error);
        }
      }
    }

    // 2. Try Groq Keys (as failover or if preferred)
    if (groqKeys.length > 0) {
      const startIndex = groqIndex % groqKeys.length;
      // Map to equivalent Llama models on Groq
      const groqModelName = modelName.includes("lite") 
        ? "llama-3.1-8b-instant" 
        : "llama-3.3-70b-versatile";
      
      for (let i = 0; i < groqKeys.length; i++) {
        const currentIdx = (startIndex + i) % groqKeys.length;
        const key = groqKeys[currentIdx];
        
        try {
          const provider = createGroq({ apiKey: key });
          const model = provider(groqModelName);
          
          if (i === 0) groqIndex++;
          
          return await model[methodName](options);
        } catch (error) {
          console.warn(`Groq key rotation failed (key ${currentIdx + 1}/${groqKeys.length}), trying next...`, error);
        }
      }
    }

    throw new Error(`All available keys in the pool failed to execute ${methodName} for model ${modelName}.`);
  };

  return {
    specificationVersion: "v1" as const,
    provider: preferredProvider,
    modelId: modelName,
    defaultObjectGenerationMode: undefined,
    doGenerate: async (options: any) => tryCall("doGenerate", options),
    doStream: async (options: any) => tryCall("doStream", options),
  };
}

export function getModel(purpose: ModelPurpose): unknown {
  switch (purpose) {
    case "agent":
    case "interpreter":
      return createPooledModel("gemini-2.5-flash", "google");

    case "enhancer":
      return createPooledModel("gemini-2.5-flash-lite", "google");

    case "summarizer":
      return createPooledModel("llama-3.1-8b-instant", "groq");

    default:
      throw new Error(`Unknown model purpose: ${purpose}`);
  }
}
