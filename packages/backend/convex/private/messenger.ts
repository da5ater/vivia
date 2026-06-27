import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { upsertSecret } from "../lib/secrets";
import { fetchMessengerPage, fetchMessengerPageName } from "../lib/messenger";

const PENDING_PAGE_ID = "__pending_messenger_page__";

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
      .query("messengerConfigs")
      .withIndex("byOrganizationId", (q) => q.eq("organizationId", user._id))
      .unique();
  },
});

/**
 * Upserts the Messenger configuration.
 *
 * Flow:
 * 1. Generate Setup Values (accessToken is not provided):
 *    Generates a verifyToken, pageId = PENDING_PAGE_ID, isEnabled = false/true.
 * 2. Connect (accessToken is provided):
 *    a. If pageId is provided manually:
 *       Tries to fetch the Page Name automatically via GET /{pageId}.
 *       If it fails, falls back to manual pageName or "Facebook Page".
 *    b. If pageId is NOT provided manually:
 *       Calls GET /me to fetch both Page ID and Page Name automatically.
 *       If it fails, throws error instructing to input Page ID manually.
 */
export const upsert = action({
  args: {
    accessToken: v.optional(v.string()),
    pageId: v.optional(v.string()),
    pageName: v.optional(v.string()),
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

    const existing = await ctx.runQuery(
      internal.system.messenger.getByOrganizationId,
      { organizationId: user._id }
    ) as {
      verifyToken: string;
      pageId: string;
      pageName?: string;
      secretName?: string;
    } | null;

    const verifyToken: string = existing?.verifyToken ?? createVerifyToken();
    const accessToken = args.accessToken?.trim();

    let pageId = args.pageId?.trim() || existing?.pageId || PENDING_PAGE_ID;
    let pageName = args.pageName?.trim() || existing?.pageName;

    if (accessToken) {
      if (args.pageId?.trim()) {
        // A manual Page ID was provided. Auto-fetch the Page Name using it.
        try {
          const name = await fetchMessengerPageName({
            pageId: args.pageId.trim(),
            accessToken,
          });
          if (name) {
            pageName = name;
          }
        } catch (error) {
          console.warn("Could not automatically fetch Page name by ID:", error);
          if (!pageName) {
            pageName = "Facebook Page";
          }
        }
      } else {
        // No manual Page ID provided, attempt automatic GET /me discovery
        try {
          const pageInfo = await fetchMessengerPage({ accessToken });
          if (pageInfo.id) {
            pageId = pageInfo.id;
            pageName = pageInfo.name;
          }
        } catch (error) {
          console.warn("Could not automatically fetch Page info from /me:", error);
          
          if (pageId === PENDING_PAGE_ID) {
            const errMsg = error instanceof Error ? error.message : String(error);
            throw new ConvexError({
              message: `Could not fetch Page info automatically. Meta returned: "${errMsg}". Please expand 'Advanced Manual Setup' below and manually input your Page ID.`,
              code: "bad_request",
            });
          }
        }
      }

      const secretName = "credentials";
      const secretKey = `tenant/${user._id}/messenger/${secretName}`;
      await upsertSecret(secretKey, { accessToken });

      await ctx.runMutation(internal.system.messenger.upsertConfig, {
        organizationId: user._id,
        pageId,
        pageName,
        verifyToken,
        secretName,
        isEnabled: args.isEnabled,
      });
    } else {
      // Just generating setup values or updating enabled state without token
      await ctx.runMutation(internal.system.messenger.upsertConfig, {
        organizationId: user._id,
        pageId,
        pageName,
        verifyToken,
        secretName: "credentials",
        isEnabled: args.isEnabled,
      });
    }

    return {
      status: "success",
      verifyToken,
    };
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

    await ctx.runMutation(internal.system.messenger.setEnabled, {
      organizationId: user._id,
      isEnabled: args.isEnabled,
    });
  },
});
