import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const NAMESPACE = "default";

export const upsert = internalMutation({
  args: {
    service: v.union(v.literal("vapi")),
    secretName: v.string(),
  },
  handler: async (ctx, args) => {
    const existingPlugin = await ctx.db
      .query("Plugins")
      .withIndex("byServiceAndNamespace", (q) =>
        q.eq("service", args.service).eq("namespace", NAMESPACE),
      )
      .unique();

    if (existingPlugin) {
      await ctx.db.patch(existingPlugin._id, {
        secretName: args.secretName,
      });
    } else {
      await ctx.db.insert("Plugins", {
        namespace: NAMESPACE,
        service: args.service,
        secretName: args.secretName,
      });
    }

    return { status: "success" };
  },
});

export const getByServiceAndNamespace = internalQuery({
  args: {
    service: v.union(v.literal("vapi")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("Plugins")
      .withIndex("byServiceAndNamespace", (q) =>
        q.eq("service", args.service).eq("namespace", NAMESPACE),
      )
      .unique();
  },
});