import { ConvexError, v } from "convex/values";
import { action, mutation, query, QueryCtx } from "../_generated/server";
import {
  contentHashFromArrayBuffer,
  Entry,
  EntryId,
  guessMimeTypeFromContents,
  guessMimeTypeFromExtension,
  vEntryId,
} from "@convex-dev/rag";
import rag from "../system/ai/rag";
import { Id } from "../_generated/dataModel";
import { extractTextContent } from "../lib/extractTextContent";
import { paginationOptsValidator } from "convex/server";

const NAMESPACE = "default";

function guessMimeType(filename: string, bytes: ArrayBuffer): string {
  return (
    guessMimeTypeFromExtension(filename) ||
    guessMimeTypeFromContents(bytes) ||
    "application/octet-stream"
  );
}

/* =========================
   Delete File
========================= */
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
      await ctx.storage.delete(entry.metadata.storageId as Id<"_storage">);
    }

    await rag.deleteAsync(ctx, {
      entryId: args.entryId,
    });
  },
});

/* =========================
   Add File (FIXED)
========================= */
export const addFile = action({
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
    const mimeType = args.mimetype || guessMimeType(filename, bytes);

    const blob = new Blob([bytes], { type: mimeType });
    const storageId = await ctx.storage.store(blob);

    const text = await extractTextContent(ctx, {
      storageId,
      filename,
      bytes,
      mimeType,
    });

    // ✅ Guard against empty / invalid text
    if (!text || text.trim().length === 0) {
      await ctx.storage.delete(storageId);
      throw new ConvexError({
        code: "EMPTY_CONTENT",
        message: "No extractable text found in file",
      });
    }

    let entryId: EntryId;
    let created = false;


    try {
      const result = await rag.add(ctx, {
        namespace: NAMESPACE,
        text: text.trim() || " ",
        key: filename,
        title: filename,
        metadata: {
          storageId,
          uploadedBy: identity.userId ?? "",
          filename,
          category: category ?? null,
        } as EntryMetadata,
        contentHash: await contentHashFromArrayBuffer(bytes),
      });

      entryId = result.entryId;
      created = result.created;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      console.error("rag.add failed:", errorMessage);
      if (errorStack) console.error("Stack:", errorStack);
      await ctx.storage.delete(storageId);
      throw new ConvexError({
        code: "RAG_ADD_FAILED",
        message: `Failed to index file content: ${errorMessage}`,
      });
    }

    if (!created) {
      console.debug("Entry already exists, skipping upload metadata");
      await ctx.storage.delete(storageId);
    }

    return {
      entryId,
      url: created ? await ctx.storage.getUrl(storageId) : null,
    };
  },
});

export const list = query({
  args: {
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
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
      return { page: [], isDone: true, continueCursor: "" };
    }

    const result = await rag.list(ctx, {
      namespaceId: namespace.namespaceId,
      paginationOpts: args.paginationOpts,
    });

    const files = await Promise.all(
      result.page.map((entry) => convertEntryToPublicFile(ctx, entry))
    );

    const filteredFiles = args.category
      ? files.filter((file) => file.category === args.category)
      : files;

    return {
      page: filteredFiles,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});


export type PublicFile = {
  id: EntryId;
  name: string;
  type: string;
  size: string;
  status: "ready" | "processing" | "error";
  url: string | null;
  category?: string;
};

type EntryMetadata = {
  storageId: Id<"_storage">;
  uploadedBy?: string;
  filename?: string;
  category?: string | null;
};

/* =========================
   Helpers
========================= */
async function convertEntryToPublicFile(
  ctx: QueryCtx,
  entry: Entry
): Promise<PublicFile> {
  const metadata = entry.metadata as EntryMetadata | undefined;
  const storageId = metadata?.storageId;
  let fileSize = "unknown";

  if (storageId) {
    try {
      const storageMetadata = await ctx.db.system.get(storageId);
      if (storageMetadata) {
        fileSize = formatFileSize(storageMetadata.size);
      }
    } catch (error) {
      console.error("Error fetching storage metadata:", error);
    }
  }

  const filename = entry.key || "unknown";
  const extension = filename.split(".").pop()?.toLowerCase() ?? "txt";

  let status: "ready" | "processing" | "error" = "error";
  if (entry.status === "ready") status = "ready";
  else if (entry.status === "pending") status = "processing";

  const url = storageId ? await ctx.storage.getUrl(storageId) : null;

  return {
    id: entry.entryId,
    name: filename,
    type: extension,
    size: fileSize,
    status,
    url,
    category: metadata?.category ?? undefined,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/* =========================
   Internal List
========================= */
export async function listFilesInternal(
  ctx: QueryCtx,
  args: {
    category?: string;
    paginationOpts: any;
  }
) {
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
    return { page: [], isDone: true, continueCursor: "" };
  }

  const result = await rag.list(ctx, {
    namespaceId: namespace.namespaceId,
    paginationOpts: args.paginationOpts,
  });

  const files = await Promise.all(
    result.page.map((entry) => convertEntryToPublicFile(ctx, entry))
  );

  const filteredFiles = args.category
    ? files.filter((f) => f.category === args.category)
    : files;

  return {
    page: filteredFiles,
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  };
}
