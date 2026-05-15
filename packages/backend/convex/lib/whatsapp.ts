const WHATSAPP_API_VERSION = "v21.0";

type WhatsAppGraphError = {
  error?: {
    message?: string;
    code?: number;
    type?: string;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function parseWhatsAppError(errorText: string): WhatsAppGraphError | null {
  try {
    return JSON.parse(errorText) as WhatsAppGraphError;
  } catch {
    return null;
  }
}

async function createWhatsAppApiError(
  response: Response,
  action: string
): Promise<Error> {
  const errorText = await response.text();
  const parsed = parseWhatsAppError(errorText);
  const error = parsed?.error;
  const isAuthError = response.status === 401 || error?.code === 190;
  const details = [
    `Meta returned ${response.status}`,
    error?.code ? `code ${error.code}` : null,
    error?.message ? `: ${error.message}` : errorText ? `: ${errorText}` : null,
    error?.fbtrace_id ? `(fbtrace_id: ${error.fbtrace_id})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const message = isAuthError
    ? "WhatsApp authentication failed. Reconnect WhatsApp with a fresh Meta access token for this Phone Number ID."
    : `Could not ${action}.`;

  return new Error(`${message} ${details}`);
}

export async function fetchWhatsAppBusinessPhoneNumber(args: {
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
    throw await createWhatsAppApiError(response, "fetch WhatsApp phone number");
  }

  const data = (await response.json()) as { display_phone_number?: string };
  return data.display_phone_number?.replace(/\D/g, "");
}

export async function sendWhatsAppText(args: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${args.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: args.to,
        type: "text",
        text: {
          preview_url: false,
          body: args.text,
        },
      }),
    }
  );

  if (!response.ok) {
    throw await createWhatsAppApiError(response, "send WhatsApp message");
  }
}
