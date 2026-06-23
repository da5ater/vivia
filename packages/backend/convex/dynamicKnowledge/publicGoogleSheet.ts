import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import rag from "../system/ai/rag";
import Papa from "papaparse";
import { Id } from "../_generated/dataModel";

// Helper to extract ID from a Google Sheet URL
function extractGoogleSheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || null;
}

/**
 * Creates a new connection to a Public Google Sheet
 */
export const connect = mutation({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const sheetId = extractGoogleSheetId(args.url);
    if (!sheetId) {
      throw new ConvexError("Invalid Google Sheet URL. Make sure you pasted the full link.");
    }

    // Insert the new data source into the database
    const sourceId = await ctx.db.insert("knowledgeSources", {
      organizationId: user._id,
      type: "google_sheet_public",
      sourceUrl: args.url,
      sourceId: sheetId,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sourceId;
  },
});

/**
 * List all knowledge sources for the current user
 */
export const listSources = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    if (!user) {
      return [];
    }

    const sources = await ctx.db
      .query("knowledgeSources")
      .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
      .order("desc")
      .collect();

    return sources;
  },
});

/**
 * Delete a knowledge source
 */
export const deleteSource = mutation({
  args: { sourceId: v.id("knowledgeSources") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new ConvexError("Source not found");

    // We should also delete all related vectors from RAG here
    const entryKey = `google_sheet_${source._id}`;
    const namespace = await rag.getNamespace(ctx, {
      namespace: source.organizationId,
    });

    if (namespace) {
      let cursor: string | null = null;
      while (true) {
        const existingEntries = await rag.list(ctx, {
          namespaceId: namespace.namespaceId,
          paginationOpts: { numItems: 100, cursor },
        });

        const oldEntry = existingEntries.page.find(e => e.key === entryKey);
        if (oldEntry) {
          await rag.deleteAsync(ctx, { entryId: oldEntry.entryId });
          break;
        }
        if (existingEntries.isDone) break;
        cursor = existingEntries.continueCursor;
      }
    }

    await ctx.db.delete(args.sourceId);
  },
});

/**
 * Trigger a manual sync for a source
 * Protected against spam: blocks if already syncing or synced within the last 2 minutes
 */
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export const triggerSync = mutation({
  args: { sourceId: v.id("knowledgeSources") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new ConvexError("Source not found");

    // Guard: don't allow sync if already syncing
    if (source.status === "syncing") {
      throw new ConvexError("A sync is already in progress. Please wait for it to finish.");
    }

    // Guard: cooldown — prevent spamming within 5 minutes of last sync
    if (source.lastSyncedAt && Date.now() - source.lastSyncedAt < SYNC_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((SYNC_COOLDOWN_MS - (Date.now() - source.lastSyncedAt)) / 1000);
      throw new ConvexError(`Please wait ${secondsLeft} seconds before syncing again.`);
    }

    // Start background sync
    await ctx.scheduler.runAfter(0, internal.dynamicKnowledge.publicGoogleSheet.syncSheet, {
      sourceId: args.sourceId,
    });
  },
});

/**
 * Toggle the paused status of a source
 */
export const togglePause = mutation({
  args: { sourceId: v.id("knowledgeSources") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new ConvexError("Source not found");

    const newStatus = source.status === "paused" ? "active" : "paused";

    await ctx.db.patch(args.sourceId, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    // If resuming from paused, automatically trigger a fresh sync
    if (newStatus === "active") {
      await ctx.scheduler.runAfter(0, internal.dynamicKnowledge.publicGoogleSheet.syncSheet, {
        sourceId: args.sourceId,
      });
    }

    return newStatus;
  },
});

/**
 * Internal Query: Get a knowledge source
 */
export const getSource = internalQuery({
  args: { sourceId: v.id("knowledgeSources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

/**
 * Internal Mutation: Update a knowledge source status
 */
export const updateSourceStatus = internalMutation({
  args: {
    sourceId: v.id("knowledgeSources"),
    status: v.union(v.literal("active"), v.literal("syncing"), v.literal("error"), v.literal("paused")),
    errorMessage: v.optional(v.string()),
    entryId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sourceId, ...updates } = args;
    await ctx.db.patch(sourceId, {
      ...updates,
      ...(updates.status === "active" ? { lastSyncedAt: Date.now() } : {}),
      updatedAt: Date.now(),
    });
  },
});

/**
 * The main action that fetches the Google Sheet, parses it, and updates the AI Knowledge Base
 */
export const syncSheet = internalAction({
  args: { sourceId: v.id("knowledgeSources") },
  handler: async (ctx, args) => {
    const source = await ctx.runQuery(internal.dynamicKnowledge.publicGoogleSheet.getSource, {
      sourceId: args.sourceId,
    });

    if (!source) {
      throw new ConvexError("Source not found");
    }

    // Guard: skip if already syncing (prevents race conditions from overlapping triggers)
    if (source.status === "syncing") {
      console.log(`Skipping sync for ${args.sourceId}: already syncing`);
      return;
    }

    // Guard: skip if paused
    if (source.status === "paused") {
      console.log(`Skipping sync for ${args.sourceId}: source is paused`);
      return;
    }

    // Set status to syncing
    await ctx.runMutation(internal.dynamicKnowledge.publicGoogleSheet.updateSourceStatus, {
      sourceId: args.sourceId,
      status: "syncing",
    });

    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${source.sourceId}/export?format=csv`;
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheet: ${response.statusText}`);
      }

      const csvData = await response.text();

      // Parse the CSV
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        console.warn("CSV Parsing Errors:", parsed.errors);
      }

      // Convert rows into a highly readable structured string for the AI
      let structuredText = `Data from Google Sheet (ID: ${source.sourceId})\n\n`;
      const rows = parsed.data as Record<string, string>[];

      rows.forEach((row, index) => {
        structuredText += `--- Item ${index + 1} ---\n`;
        for (const [key, value] of Object.entries(row)) {
          if (value && value.trim() !== "") {
            structuredText += `${key}: ${value}\n`;
          }
        }
        structuredText += `\n`;
      });

      // Name of the entry in the Vector database
      const entryKey = `google_sheet_${source._id}`;

      // 1. Delete the old vector document if it exists (to prevent duplicates)
      const namespace = await rag.getNamespace(ctx, {
        namespace: source.organizationId,
      });

      if (namespace) {
        let cursor: string | null = null;
        while (true) {
          const existingEntries = await rag.list(ctx, {
            namespaceId: namespace.namespaceId,
            paginationOpts: { numItems: 100, cursor },
          });

          const oldEntry = existingEntries.page.find(e => e.key === entryKey);
          if (oldEntry) {
            await rag.deleteAsync(ctx, { entryId: oldEntry.entryId });
            break;
          }
          if (existingEntries.isDone) break;
          cursor = existingEntries.continueCursor;
        }
      }

      // 2. Add the new updated text
      const newEntry = await rag.add(ctx, {
        namespace: source.organizationId,
        text: structuredText,
        key: entryKey,
        title: `Google Sheet Data (${new Date().toLocaleString()})`,
        metadata: {
          type: "google_sheet_public",
          sourceId: source._id,
        },
      });

      // 3. Mark as successful
      await ctx.runMutation(internal.dynamicKnowledge.publicGoogleSheet.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "active",
        errorMessage: undefined,
      });

      return { success: true, rowsSynced: rows.length };

    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error occurred";

      // Mark as error
      await ctx.runMutation(internal.dynamicKnowledge.publicGoogleSheet.updateSourceStatus, {
        sourceId: args.sourceId,
        status: "error",
        errorMessage: msg,
      });

      throw new ConvexError(msg);
    }
  },
});
