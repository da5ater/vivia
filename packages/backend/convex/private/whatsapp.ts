import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { upsertSecret } from "../lib/secrets";

function createVerifyToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

const WHATSAPP_API_VERSION = "v21.0";

async function getBusinessPhoneNumber(args: {
  phoneNumberId: string;
  accessToken: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${args.phoneNumberId}?fields=display_phone_number`,
    {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not fetch WhatsApp phone number: ${response.status} ${errorText}`);
  }

  const data = await response.json() as { display_phone_number?: string };
  return data.display_phone_number?.replace(/\D/g, "");
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
    accessToken: v.string(),
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

    const accessToken = args.accessToken.trim();
    const phoneNumberId = args.phoneNumberId.trim();
    const businessPhoneNumber =
      args.businessPhoneNumber?.replace(/\D/g, "") ||
      await getBusinessPhoneNumber({ phoneNumberId, accessToken });

    if (!phoneNumberId) {
      throw new ConvexError({
        message: "Phone Number ID is required",
        code: "bad_request",
      });
    }

    if (!accessToken) {
      throw new ConvexError({
        message: "Access token is required",
        code: "bad_request",
      });
    }

    const existing = await ctx.runQuery(
      internal.system.whatsapp.getByOrganizationId,
      { organizationId: user._id }
    ) as { verifyToken: string } | null;
    const verifyToken: string = existing?.verifyToken ?? createVerifyToken();
    const secretName = "credentials";
    const secretKey = `tenant/${user._id}/whatsapp/${secretName}`;

    await upsertSecret(secretKey, { accessToken });

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
