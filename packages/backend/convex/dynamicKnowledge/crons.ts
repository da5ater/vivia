import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

export const getActivePublicSheets = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("knowledgeSources")
      .withIndex("byType", (q) => q.eq("type", "google_sheet_public"))
      .filter((q) => q.neq(q.field("status"), "error"))
      .filter((q) => q.neq(q.field("status"), "paused"))
      .collect();
  },
});

export const syncAllSources = internalAction({
  args: {},
  handler: async (ctx) => {
    const sheets = await ctx.runQuery(internal.dynamicKnowledge.crons.getActivePublicSheets);

    console.log(`Starting scheduled sync for ${sheets.length} public Google Sheets...`);

    for (const sheet of sheets) {
      try {
        await ctx.runAction(internal.dynamicKnowledge.publicGoogleSheet.syncSheet, {
          sourceId: sheet._id,
        });
        console.log(`Successfully synced sheet ${sheet.sourceId}`);
      } catch (error) {
        console.error(`Failed to sync sheet ${sheet.sourceId}:`, error);
        // The individual action already marks it as 'error' in the DB
      }
    }
    
    console.log("Finished scheduled sync.");
  },
});
