import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run everyday at Midnight UTC to sync all dynamic knowledge bases
crons.daily(
  "Sync all public google sheets",
  { hourUTC: 0, minuteUTC: 0 },
  internal.dynamicKnowledge.crons.syncAllSources
);

export default crons;
