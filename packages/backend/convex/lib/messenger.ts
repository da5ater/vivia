const MESSENGER_API_VERSION = "v21.0";

type MessengerGraphError = {
  error?: {
    message?: string;
    code?: number;
    type?: string;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

function parseMessengerError(errorText: string): MessengerGraphError | null {
  try {
    return JSON.parse(errorText) as MessengerGraphError;
  } catch {
    return null;
  }
}

async function createMessengerApiError(
  response: Response,
  action: string
): Promise<Error> {
  const errorText = await response.text();
  const parsed = parseMessengerError(errorText);
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
    ? "Messenger authentication failed. Reconnect Messenger with a fresh Meta Page Access Token."
    : `Could not ${action}.`;

  return new Error(`${message} ${details}`);
}

/**
 * Calls GET /me?fields=id,name using the Page Access Token.
 * Returns the Page ID and name — used to validate the token and
 * auto-fill the page name during setup.
 */
export async function fetchMessengerPage(args: {
  accessToken: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${MESSENGER_API_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(args.accessToken)}`,
  );

  if (!response.ok) {
    throw await createMessengerApiError(response, "fetch Messenger page info");
  }

  return (await response.json()) as { id?: string; name?: string };
}

/**
 * Calls GET /{pageId}?fields=name using the Page Access Token.
 * Used when the Page ID is known/provided, but we need to resolve the name.
 */
export async function fetchMessengerPageName(args: {
  pageId: string;
  accessToken: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${MESSENGER_API_VERSION}/${args.pageId}?fields=name&access_token=${encodeURIComponent(args.accessToken)}`,
  );

  if (!response.ok) {
    throw await createMessengerApiError(response, "fetch Messenger page name");
  }

  const data = (await response.json()) as { name?: string };
  return data.name;
}

/**
 * Calls GET /{psid}?fields=first_name,last_name using the Page Access Token.
 * Returns the customer's profile name if successful.
 */
export async function fetchMessengerProfile(args: {
  psid: string;
  accessToken: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${MESSENGER_API_VERSION}/${args.psid}?fields=first_name,last_name,profile_pic&access_token=${encodeURIComponent(args.accessToken)}`,
  );

  if (!response.ok) {
    console.warn(`Could not fetch Messenger user profile: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    first_name?: string;
    last_name?: string;
    profile_pic?: string;
  };
  
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ");
  return {
    name: name || undefined,
    profilePic: data.profile_pic || undefined,
  };
}

/**
 * Sends a text message via the Messenger Send API.
 */
export async function sendMessengerText(args: {
  accessToken: string;
  to: string;
  text: string;
}) {
  const response = await fetch(
    `https://graph.facebook.com/${MESSENGER_API_VERSION}/me/messages?access_token=${encodeURIComponent(args.accessToken)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: args.to },
        message: { text: args.text },
        messaging_type: "RESPONSE",
      }),
    }
  );

  if (!response.ok) {
    throw await createMessengerApiError(response, "send Messenger message");
  }
}
