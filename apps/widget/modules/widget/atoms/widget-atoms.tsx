import { atom } from "jotai";
import { WidgetScreen } from "../types";
import { atomWithStorage } from "jotai/utils";
import { Doc, Id } from "@workspace/backend/convex/_generated/dataModel";

export const widgetScreenAtom = atom<WidgetScreen>("loading");

export const errorMessageAtom = atom<string | null>(null);

export const loadingMessageAtom = atom<string | null>(null);

export const contactSessionIdAtom =
  atomWithStorage<Id<"contact_sessions"> | null>(
    "echo_contact_session", // Static key, no Org ID needed
    null
  );

export const conversationIdAtom = atom<Id<"conversations"> | null>(null);

export const widgetSettingsAtom = atom<Doc<"widgetSettings"> | null>(null);

