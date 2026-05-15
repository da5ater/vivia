import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { upsertSecret } from "../lib/secrets";
import { fetchWhatsAppBusinessPhoneNumber } from "../lib/whatsapp";

function createVerifyToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export const getOne = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "not_found" });
    }

    return await ctx.db
      .query("whatsappConfigs")
      .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
      .unique();
  },
});

export const upsert = action({
  args: {
    phoneNumberId: v.string(),
    businessPhoneNumber: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ status: string; verifyToken: string }> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }

    const user = await ctx.runQuery(api.users.getMyUser);
    if (!user) {
      throw new ConvexError({ message: "User not found", code: "not_found" });
    }

    const phoneNumberId = args.phoneNumberId.trim();

    if (!phoneNumberId) {
      throw new ConvexError({
        message: "Phone Number ID is required",
        code: "bad_request",
      });
    }

    const existing = await ctx.runQuery(
      internal.system.whatsapp.getByOrganizationId,
      { organizationId: user._id }
    ) as {
      verifyToken: string;
      phoneNumberId: string;
      businessPhoneNumber?: string;
    } | null;
    const accessToken = args.accessToken?.trim() ?? "";
    const phoneNumberChanged = Boolean(
      existing && existing.phoneNumberId !== phoneNumberId
    );

    if ((!existing || phoneNumberChanged) && !accessToken) {
      throw new ConvexError({
        message: "Access token is required for this Phone Number ID",
        code: "bad_request",
      });
    }

    const verifyToken: string = existing?.verifyToken ?? createVerifyToken();
    const secretName = "credentials";
    const secretKey = `tenant/${user._id}/whatsapp/${secretName}`;
    const fetchedBusinessPhoneNumber = accessToken
      ? await fetchWhatsAppBusinessPhoneNumber({ phoneNumberId, accessToken })
      : undefined;
    const canReuseBusinessPhoneNumber =
      existing?.phoneNumberId === phoneNumberId && existing.businessPhoneNumber;
    const businessPhoneNumber =
      args.businessPhoneNumber?.replace(/\D/g, "") ||
      canReuseBusinessPhoneNumber ||
      fetchedBusinessPhoneNumber;

    if (accessToken) {
      await upsertSecret(secretKey, { accessToken });
    }

    await ctx.runMutation(internal.system.whatsapp.upsertConfig, {
      organizationId: user._id,
      phoneNumberId,
      businessPhoneNumber,
      verifyToken,
      secretName,
      isEnabled: args.isEnabled,
    });

    return { status: "success", verifyToken };
  },
});

export const setEnabled = mutation({
  args: {
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "unauthorized",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", identity.email!.toLowerCase()))
      .unique();

    if (!user) {
      throw new ConvexError({ message: "User not found", code: "not_found" });
    }

    await ctx.runMutation(internal.system.whatsapp.setEnabled, {
      organizationId: user._id,
      isEnabled: args.isEnabled,
    });
  },
});
