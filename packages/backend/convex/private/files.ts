import { ConvexError, v } from "convex/values";
import { action, mutation } from "../_generated/server";
import {
  contentHashFromArrayBuffer,
  guessMimeTypeFromContents,
  guessMimeTypeFromExtension,
  RAG,
  vEntryId,
} from "@convex-dev/rag";
import rag from "../system/ai/rag";
import { Id } from "../_generated/dataModel";
import { extractText } from "@convex-dev/agent";
import { fi } from "zod/v4/locales";
import { extractTextContent } from "../lib/extractTextContent";

const NAMESPACE = "default";

function guessMimeType(filename: string, bytes: ArrayBuffer): string {
  return (
    guessMimeTypeFromExtension(filename) ||
    guessMimeTypeFromContents(bytes) ||
    "application/octet-stream"
  );
}

export const deleteFile = mutation({
  args: {
    entryId: vEntryId,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    const namespace = await rag.getNamespace(ctx, {
      namespace: NAMESPACE,
    });
    if (!namespace) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Invalid namespace",
      });
    }

    const entry = await rag.getEntry(ctx, {
      entryId: args.entryId,
    });
    if (!entry) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Entry not found",
      });
    }

    if (entry.metadata?.storageId) {
      await ctx.storage.delete(
        entry.metadata.storageId as Id<"_storage">
      );
    }

    await rag.deleteAsync(ctx, {
      entryId: args.entryId,
    });
  },
});

export const addfile = action({
  args: {
    filename: v.string(),
    mimetype: v.string(),
    bytes: v.bytes(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Contact session is invalid or has expired",
        code: "unauthorized",
      });
    }

    const { bytes, filename, category } = args;
    const mimeType =
      args.mimetype || guessMimeType(filename, bytes);

    const blob = new Blob([bytes], { type: mimeType });
    const storageId = await ctx.storage.store(blob);

    const text = await extractTextContent(ctx, {
      storageId,
      filename,
      bytes,
      mimeType,
    });

    const { entryId, created } = await rag.add(ctx, {
      namespace: NAMESPACE,
      text,
      key: filename,
      title: filename,
      metadata: {
        storageId,
        uploadedBy: identity.userId ?? "",
        filename,
        category: category ?? null,
      },
      contentHash: await contentHashFromArrayBuffer(bytes),
    });

    if (!created) {
      console.debug(
        "Entry already exists, skipping upload metadata"
      );
      await ctx.storage.delete(storageId);
    }

    return {
      url: await ctx.storage.getUrl(storageId),
      entryId,
    };
  },
});
