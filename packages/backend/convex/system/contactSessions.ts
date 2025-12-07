import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getOne = internalQuery({
  args: {
    contactSessionId: v.id("contact_sessions"),
  },
  handler: async (ctx, { contactSessionId }) => {
    const session = await ctx.db.get(contactSessionId);
    if (!session) {
      return null;
    }
    return session;
  },
});
