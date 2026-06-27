import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/whatsapp",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const verifyToken = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode !== "subscribe" || !verifyToken || !challenge) {
            return new Response("Invalid verification request", { status: 400 });
        }

        const config = await ctx.runQuery(
            internal.system.whatsapp.getByVerifyToken,
            { verifyToken }
        );

        if (!config) {
            return new Response("Verification failed", { status: 403 });
        }

        return new Response(challenge, { status: 200 });
    }),
});

http.route({
    path: "/whatsapp",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        let payload: {
            entry?: Array<{
                changes?: Array<{
                    value?: {
                        metadata?: {
                            phone_number_id?: string;
                        };
                        contacts?: Array<{
                            wa_id?: string;
                            profile?: {
                                name?: string;
                            };
                        }>;
                        messages?: Array<{
                            from?: string;
                            type?: string;
                            text?: {
                                body?: string;
                            };
                        }>;
                    };
                }>;
            }>;
        };

        try {
            payload = await request.json();
        } catch {
            return new Response("Invalid JSON", { status: 400 });
        }

        for (const entry of payload.entry ?? []) {
            for (const change of entry.changes ?? []) {
                const value = change.value;
                const phoneNumberId = value?.metadata?.phone_number_id;

                if (!phoneNumberId) continue;

                for (const message of value?.messages ?? []) {
                    if (message.type !== "text" || !message.from || !message.text?.body) {
                        continue;
                    }

                    const contact = value?.contacts?.find(
                        (candidate) => candidate.wa_id === message.from
                    );

                    try {
                        await ctx.runAction(
                            internal.system.whatsappActions.handleIncomingMessage,
                            {
                                phoneNumberId,
                                from: message.from,
                                profileName: contact?.profile?.name,
                                text: message.text.body,
                            }
                        );
                    } catch (error) {
                        console.error("WhatsApp message handling failed:", error);
                    }
                }
            }
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
    }),
});

http.route({
    path: "/messenger",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const verifyToken = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode !== "subscribe" || !verifyToken || !challenge) {
            return new Response("Invalid verification request", { status: 400 });
        }

        const config = await ctx.runQuery(
            internal.system.messenger.getByVerifyToken,
            { verifyToken }
        );

        if (!config) {
            return new Response("Verification failed", { status: 403 });
        }

        return new Response(challenge, { status: 200 });
    }),
});

http.route({
    path: "/messenger",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        let payload: {
            object?: string;
            entry?: Array<{
                id?: string;
                messaging?: Array<{
                    sender?: { id?: string };
                    recipient?: { id?: string };
                    message?: {
                        mid?: string;
                        text?: string;
                    };
                }>;
            }>;
        };

        try {
            payload = await request.json();
        } catch {
            return new Response("Invalid JSON", { status: 400 });
        }

        if (payload.object === "page") {
            for (const entry of payload.entry ?? []) {
                const pageId = entry.id;

                if (!pageId) continue;

                for (const event of entry.messaging ?? []) {
                    if (!event.message?.text || !event.sender?.id) {
                        continue;
                    }

                    try {
                        await ctx.runAction(
                            internal.system.messengerActions.handleIncomingMessage,
                            {
                                pageId,
                                from: event.sender.id,
                                text: event.message.text,
                            }
                        );
                    } catch (error) {
                        console.error("Messenger message handling failed:", error);
                    }
                }
            }
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
    }),
});

http.route({
    path: "/clerk-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const event = await validateRequest(request);

        if (!event) {
            return new Response("Invalid request", { status: 400 });
        }

        console.log("Clerk Webhook Event:", event.type, event.data);

        // Cast to any: the @clerk/backend WebhookEvent union doesn't include
        // the newer "commerce.subscription.*" billing events yet.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawEvent = event as any;

        switch (rawEvent.type) {
            // ─── User lifecycle ───────────────────────────────────────────────
            case "user.created":
            case "user.updated": {
                // Nothing to do here — syncUser handles this from the client.
                return new Response("User event received", { status: 200 });
            }

            // ─── Clerk Billing / Commerce subscription events ─────────────────
            // Clerk fires "commerce.subscription.*" events, NOT "subscription.*"
            case "subscription.active":
            case "subscription.created":
            case "subscription.updated":
            case "subscription.pastDue":
            case "commerce.subscription.activated":
            case "commerce.subscription.created":
            case "commerce.subscription.updated":
            case "commerce.subscription.past_due": {
                const subscription = rawEvent.data as {
                    status?: string;
                    // Clerk sends the Clerk user ID under "subscriber_id"
                    subscriber_id?: string;
                    payer?: {
                        user_id?: string;
                    };
                };
                const subscriberId = subscription.subscriber_id ?? subscription.payer?.user_id;

                if (!subscription.status) {
                    console.warn("Received subscription event without status:", rawEvent.type);
                    return new Response("Missing subscription status", { status: 400 });
                }

                if (!subscriberId) {
                    console.warn("Received subscription event without subscriber id:", rawEvent.type);
                    return new Response("Missing subscriber_id", { status: 400 });
                }

                // Look up the DB user by their Clerk token identifier
                const user = await ctx.runQuery(internal.users.getByTokenIdentifier, {
                    tokenIdentifier: subscriberId,
                });

                if (!user) {
                    console.warn(
                        "Could not find DB user for subscriber id:",
                        subscriberId,
                        "— event:",
                        rawEvent.type
                    );
                }

                await ctx.runMutation(internal.system.subscription.upsert, {
                    organizationId: user?._id,
                    subscriberId,
                    status: subscription.status,
                });

                console.log(
                    `Subscription status updated for subscriber ${subscriberId} to: ${subscription.status}`
                );
                return new Response("Subscription updated", { status: 200 });
            }

            case "subscription.canceled":
            case "commerce.subscription.canceled": {
                const subscription = rawEvent.data as {
                    subscriber_id?: string;
                    payer?: {
                        user_id?: string;
                    };
                };
                const subscriberId = subscription.subscriber_id ?? subscription.payer?.user_id;

                if (!subscriberId) {
                    return new Response("Missing subscriber_id", { status: 400 });
                }

                const user = await ctx.runQuery(internal.users.getByTokenIdentifier, {
                    tokenIdentifier: subscriberId,
                });

                await ctx.runMutation(internal.system.subscription.upsert, {
                    organizationId: user?._id,
                    subscriberId,
                    status: "canceled",
                });
                console.log(`Subscription canceled for subscriber ${subscriberId}`);

                return new Response("Subscription canceled", { status: 200 });
            }

            default:
                console.log("Ignored Clerk event type:", rawEvent.type);
                return new Response("Event ignored", { status: 200 });
        }
    }),
});

async function validateRequest(
    request: Request
): Promise<WebhookEvent | null> {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
        return null;
    }

    try {
        const payload = await request.text();

        const headers = {
            "svix-id": request.headers.get("svix-id") ?? "",
            "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
            "svix-signature": request.headers.get("svix-signature") ?? "",
        };

        const webhook = new Webhook(WEBHOOK_SECRET);
        return webhook.verify(payload, headers) as WebhookEvent;
    } catch (error) {
        console.error("Error validating webhook request:", error);
        return null;
    }
}

export default http;
