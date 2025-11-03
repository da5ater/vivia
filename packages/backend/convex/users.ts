import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// queries
//----------------------------------------------------------------------------------------

export const getMany = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

//----------------------------------------------------------------------------------------

// mutations
//----------------------------------------------------------------------------------------

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: now,
    });
    return userId;
  },
});

//----------------------------------------------------------------------------------------
