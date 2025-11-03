import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // store createdAt as a UNIX timestamp (milliseconds) using a number validator
    createdAt: v.number(),
  })
    .index("byEmail", ["email"])
    .index("byCreatedAt", ["createdAt"]),
});

export default schema;
