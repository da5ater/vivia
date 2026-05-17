/**
 * Widget State Atoms (Global State)
 * 
 * This file defines the global "state" of our chat widget using Jotai.
 * Atoms are like tiny containers for specific pieces of information that 
 * can be shared across many different components.
 */

import { atom } from "jotai";
import { WidgetScreen } from "../types";
import { atomWithStorage } from "jotai/utils";
import { Id } from "@workspace/backend/convex/_generated/dataModel";

/**
 * Tracks which screen is currently visible in the widget (e.g., 'loading', 'chat', 'auth').
 */
export const widgetScreenAtom = atom<WidgetScreen>("loading");

/**
 * Stores a global error message to be displayed if something goes wrong.
 */
export const errorMessageAtom = atom<string | null>(null);

/**
 * Stores the message shown while the widget is performing a background task.
 */
export const loadingMessageAtom = atom<string | null>(null);

/**
 * Stores the ID of the current user's session.
 * 
 * We use 'atomWithStorage' so that if the user refreshes their browser, 
 * they don't get logged out. The ID is saved in their local storage.
 */
export const contactSessionIdAtom =
  atomWithStorage<Id<"contact_sessions"> | null>(
    "vivia_contact_session",
    null
  );

/**
 * Remembers which company's widget the user was last looking at.
 * Saved in local storage.
 */
export const widgetSlugAtom = atomWithStorage<string | null>(
  "vivia_widget_slug",
  null
);

/**
 * Tracks which specific conversation thread the user is currently viewing.
 */
export const conversationIdAtom = atom<Id<"conversations"> | null>(null);

// Matches the shape returned by api.public.widgetSettings.get
/**
 * The configuration settings for the widget (colors, messages, features).
 */
export type WidgetSettings = {
  isActive: boolean;
  greetMessage: string;
  defaultSuggestions: {
    suggestion1: string;
    suggestion2: string;
    suggestion3: string;
  };
  assistantId: string | undefined;
  phoneNumber: string | undefined;
  organizationId: Id<"users">;
  organizationName: string | undefined;
};

/**
 * Stores the current organization's widget settings once they are loaded.
 */
export const widgetSettingsAtom = atom<WidgetSettings | null>(null);

/**
 * Stores public API keys for the voice AI (Vapi) integration.
 */
export const vapiSecretsAtom = atom<{
  publicApiKey: string;
} | null>(null);

/**
 * A derived atom that quickly tells us if voice chat is available.
 */
export const hasVapiSecretsAtom = atom((get) => get(vapiSecretsAtom) !== null);
