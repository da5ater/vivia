import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { StorageActionWriter } from "convex/server";
import { assert } from "convex-helpers";
import { Id } from "../_generated/dataModel";

// --- AI Models ---
const AI_MODELS = {
  image: google("gemini-2.5-flash"),
  pdf: google("gemini-2.5-flash"),
  html: google("gemini-2.5-flash"),
} as const;

// --- Supported image types ---
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/bmp",
  "image/tiff",
] as const;

// --- System prompts ---
const SYSTEM_PROMPTS = {
  image: `You are a highly skilled AI assistant that analyzes images containing text. 
Your task is to:
1. Detect and extract all visible text, including headings, captions, and annotations.
2. Identify important keywords, numbers, and entities.
3. Provide a concise and structured summary of the image's content, highlighting key points.
4. If the image contains tables or forms, extract the data in a readable format.`,
  pdf: `You are an advanced AI assistant that processes PDF documents. 
Your task is to:
1. Extract all textual content from the PDF, preserving structure such as headings, lists, and tables.
2. Identify key concepts, figures, and relevant details.
3. Provide a clear, concise, and structured summary, highlighting main points and insights.
4. If the PDF contains complex tables or multi-page content, summarize accurately without losing context.`,
  html: `You are a smart AI assistant specialized in analyzing HTML content. 
Your task is to:
1. Extract all textual information, including headings, paragraphs, lists, and links.
2. Identify the main content versus navigation, ads, or boilerplate.
3. Summarize the page in a clear and concise format, highlighting essential points.
4. Preserve meaningful structure (e.g., headings, lists) in your summary for readability.`,
} as const;

// --- Type for arguments ---
export type ExtractTextContentArgs = {
  storageId: Id<"_storage">;
  filename: string;
  bytes?: ArrayBuffer;
  mimeType: string;
};

export async function extractTextContent(
  ctx: { storage: StorageActionWriter },
  args: ExtractTextContentArgs
): Promise<string> {
  const { storageId, filename, bytes, mimeType } = args;

  const url = await ctx.storage.getUrl(storageId);
  assert(url, "Failed to get storage URL");

  if (SUPPORTED_IMAGE_TYPES.some((type => type === mimeType))) {
    return extractImageText(url);
  }

  if (mimeType.toLowerCase().includes("pdf")) {
    return extractPdfText(url);
  }


  if (mimeType.toLowerCase().includes("text")) {
    return extractTextFileContent(ctx, storageId, bytes, mimeType);
  }

  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

async function extractTextFileContent(
  ctx: { storage: StorageActionWriter },
  storageId: Id<"_storage">,
  bytes?: ArrayBuffer,
  mimeType?: string
): Promise<string> {
  const fileBuffer =
    bytes || (await (await ctx.storage.get(storageId))?.arrayBuffer());

  if (!fileBuffer) {
    throw new Error("Failed to retrieve file contents for text extraction");
  }

  const text = new TextDecoder("utf-8").decode(fileBuffer);

  if (mimeType?.toLowerCase() !== "text/plain") {
    const result = await generateText({
      model: AI_MODELS.html,
      system: SYSTEM_PROMPTS.html,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            {
              type: "text",
              text: "Please extract and summarize all text content from the provided file, preserving structure and key details.",
            },
          ],
        },
      ],
    });
    return result.text;
  }

  return text;
}

async function extractPdfText(
  url: string
): Promise<string> {
  const result = await generateText({
    model: AI_MODELS.pdf,
    system: SYSTEM_PROMPTS.pdf,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: new URL(url),
            mediaType: "application/pdf",
          },
          {
            type: "text",
            text: "Please extract and summarize all text content from the provided PDF file, preserving structure and key details.",
          },
        ],
      },
    ],
  });

  return result.text;
}

async function extractImageText(url: string): Promise<string> {
  const result = await generateText({
    model: AI_MODELS.image,
    system: SYSTEM_PROMPTS.image,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: new URL(url) },
          {
            type: "text",
            text: "Please extract and summarize all text content from the provided image, including headings, tables, and annotations.",
          },
        ],
      },
    ],
  });

  return result.text;
}
