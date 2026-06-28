import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

// Parse keys from environment variables (handles comma-separated lists or fallback to single key)
export const getGeminiKeys = () => {
  const keys: string[] = [];
  const addKeys = (str: string | undefined) => {
    if (str) {
      str.split(",").forEach(k => {
        const trimmed = k.trim();
        if (trimmed && !keys.includes(trimmed)) {
          keys.push(trimmed);
        }
      });
    }
  };
  addKeys(process.env.GEMINI_API_KEYS);
  addKeys(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  addKeys(process.env.GEMINI_API_KEY);
  return keys;
};

const getGroqKeys = () => {
  const keys: string[] = [];
  const addKeys = (str: string | undefined) => {
    if (str) {
      str.split(",").forEach(k => {
        const trimmed = k.trim();
        if (trimmed && !keys.includes(trimmed)) {
          keys.push(trimmed);
        }
      });
    }
  };
  addKeys(process.env.GROQ_API_KEYS);
  addKeys(process.env.GROQ_API_KEY);
  return keys;
};

const fetchWithTimeout = (timeoutMs: number) => {
  return async (url: string, init?: RequestInit) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };
};

// BUG 9 FIX: Module-level mutable counters reset on every serverless cold start,
// making round-robin effectively always start from key[0].
// Replaced with a random starting index per call for true stateless key distribution.
function getRandomStartIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

type ModelPurpose = "agent" | "interpreter" | "enhancer" | "summarizer";

function sanitizeUsage(usage: any) {
  if (!usage) return usage;

  const sanitizeCount = (count: any) => {
    if (typeof count === 'object' && count !== null) {
      return count.total ?? 0;
    }
    return count ?? 0;
  };

  return {
    promptTokens: sanitizeCount(usage.promptTokens),
    completionTokens: sanitizeCount(usage.completionTokens),
    totalTokens: sanitizeCount(usage.totalTokens),
    inputTokens: sanitizeCount(usage.inputTokens),
    outputTokens: sanitizeCount(usage.outputTokens),
    reasoningTokens: sanitizeCount(usage.reasoningTokens),
    cachedInputTokens: sanitizeCount(usage.cachedInputTokens),
  };
}

function sanitizeModelResult(result: any) {
  if (!result) return result;

  // Fix finishReason if it's an object
  if (result.finishReason && typeof result.finishReason === "object") {
    result.finishReason = result.finishReason.unified || "unknown";
  }

  // Fix usage if it contains nested objects
  if (result.usage) {
    result.usage = sanitizeUsage(result.usage);
  }

  return result;
}

function sanitizeStream(stream: ReadableStream<any>) {
  const reader = stream.getReader();
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        
        if (value && value.type === "finish") {
          if (value.finishReason && typeof value.finishReason === "object") {
            value.finishReason = value.finishReason.unified || "unknown";
          }
          if (value.usage) {
            value.usage = sanitizeUsage(value.usage);
          }
        }
        
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      reader.cancel(reason);
    }
  });
}

function createPooledModel(modelName: string, preferredProvider: "google" | "groq") {
  const tryCall = async (methodName: "doGenerate" | "doStream", options: any) => {
    const geminiKeys = getGeminiKeys();
    const groqKeys = getGroqKeys();

    // Determine the order of providers to try based on preference
    const providersToTry: Array<"google" | "groq"> = [];
    if (preferredProvider === "google") {
      providersToTry.push("google", "groq");
    } else {
      providersToTry.push("groq", "google");
    }

    for (const providerType of providersToTry) {
      // 1. Try Google Gemini
      if (providerType === "google" && geminiKeys.length > 0) {
        const startIndex = getRandomStartIndex(geminiKeys.length);
        for (let i = 0; i < geminiKeys.length; i++) {
          const currentIdx = (startIndex + i) % geminiKeys.length;
          const key = geminiKeys[currentIdx];

          try {
            const provider = createGoogleGenerativeAI({ apiKey: key });
            const model = provider(modelName);

            const result = await model[methodName](options);
            if (methodName === "doGenerate") {
              return sanitizeModelResult(result);
            } else if (methodName === "doStream" && result && (result as any).stream) {
              return {
                ...result,
                stream: sanitizeStream((result as any).stream),
              };
            }
            return result;
          } catch (error) {
            console.warn(`Gemini key rotation failed (key ${currentIdx + 1}/${geminiKeys.length}), trying next...`, error);
          }
        }
      }

      // 2. Try Groq
      if (providerType === "groq" && groqKeys.length > 0) {
        const startIndex = getRandomStartIndex(groqKeys.length);
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

            const result = await model[methodName](options);
            if (methodName === "doGenerate") {
              return sanitizeModelResult(result);
            } else if (methodName === "doStream" && result && (result as any).stream) {
              return {
                ...result,
                stream: sanitizeStream((result as any).stream),
              };
            }
            return result;
          } catch (error) {
            console.warn(`Groq key rotation failed (key ${currentIdx + 1}/${groqKeys.length}), trying next...`, error);
          }
        }
      }
    }

    throw new Error(`All available keys in the pool failed to execute ${methodName} for model ${modelName}.`);
  };

  return {
    specificationVersion: "v3" as const,
    provider: preferredProvider,
    modelId: modelName,
    defaultObjectGenerationMode: undefined,
    supportedUrls: undefined,
    doGenerate: async (options: any) => tryCall("doGenerate", options),
    doStream: async (options: any) => tryCall("doStream", options),
  } as any as LanguageModel;
}

export function getModel(purpose: ModelPurpose): LanguageModel {
  switch (purpose) {
    // Main support agent: needs strong tool-calling + reasoning → Gemini 2.5 Flash (Google-first)
    case "agent":
      return createPooledModel("gemini-2.5-flash", "google");

    // Search result interpreter: fires on EVERY search tool call, needs to be FAST.
    // Groq Llama 3.3 70B responds in <2s vs gemini-2.5-flash's 15–30s (thinking overhead).
    case "interpreter":
      return createPooledModel("gemini-2.5-flash", "google");

    // Operator message enhancer: fast, groq-first
    case "enhancer":
      return createPooledModel("gemini-2.5-flash-lite", "groq");

    // Post-conversation summarizer: lightweight task, Groq 8B is plenty
    case "summarizer":
      return createPooledModel("llama-3.1-8b-instant", "groq");

    default:
      throw new Error(`Unknown model purpose: ${purpose}`);
  }
}
