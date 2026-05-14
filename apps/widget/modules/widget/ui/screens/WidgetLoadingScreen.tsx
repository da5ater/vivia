/**
 * Widget Loading Screen
 * 
 * This is the first screen a user sees when they open the chat widget.
 * It's responsible for "warming up" the app: checking if the user was 
 * already chatting, loading the company's custom settings, and preparing 
 * the AI voice features.
 */

"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { api } from "@workspace/backend/convex/_generated/api";
import { WidgetHeader } from "../components/widget-header";
import { Loader2 } from "lucide-react";
import {
  contactSessionIdAtom,
  conversationIdAtom,
  errorMessageAtom,
  loadingMessageAtom,
  widgetScreenAtom,
  widgetSlugAtom,
  widgetSettingsAtom,
  vapiSecretsAtom,
} from "../../atoms/widget-atoms";
import { useAction, useMutation, useQuery } from "convex/react";
import { formatViviaOrganizationName } from "../../lib/branding";

/**
 * Tracks which stage of the setup we are currently in.
 * session  -> Checking if the user has a valid login.
 * settings -> Loading the company's custom colors/messages.
 * vapi     -> Preparing the voice chat features.
 * done     -> All set! Time to show the main chat.
 */
type InitStep = "session" | "settings" | "vapi" | "done";

interface WidgetLoadingScreenProps {
  slug: string; // The unique name of the company (from the URL)
}

/**
 * The main component for the loading screen.
 * It runs a sequence of steps to make sure the widget is ready to use.
 */
export const WidgetLoadingScreen = ({ slug }: WidgetLoadingScreenProps) => {
  const [step, setStep] = useState<InitStep>("session");
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Tools to update our global "app state" (using Jotai)
  const setErrorMessage = useSetAtom(errorMessageAtom);
  const setScreen = useSetAtom(widgetScreenAtom);
  const setLoadingMessage = useSetAtom(loadingMessageAtom);
  const setWidgetSettings = useSetAtom(widgetSettingsAtom);
  const setVapiSecrets = useSetAtom(vapiSecretsAtom);
  const setContactSessionId = useSetAtom(contactSessionIdAtom);
  const setConversationId = useSetAtom(conversationIdAtom);
  const setStoredSlug = useSetAtom(widgetSlugAtom);

  // Read current saved state
  const contactSessionId = useAtomValue(contactSessionIdAtom);
  const storedSlug = useAtomValue(widgetSlugAtom);

  // Backend connection tools
  const validateContactSession = useMutation(
    api.public.contact_sessions.validate
  );

  /**
   * Cleanup old data from previous versions of the app.
   */
  useEffect(() => {
    const legacyPrefix = `ec${"ho"}_`;
    localStorage.removeItem(`${legacyPrefix}contact_session`);
    localStorage.removeItem(`${legacyPrefix}widget_slug`);
  }, []);

  /**
   * STEP 1: Session Validation
   * Checks if the user was previously chatting. If they were, and their 
   * session is still valid, we'll skip the "Sign In" form and go straight to chat.
   */
  useEffect(() => {
    const init = async () => {
      try {
        setLoadingMessage("Getting your support space ready...");

        // If the user changed websites (different slug), clear their old session
        if (storedSlug !== slug) {
          setContactSessionId(null);
          setConversationId(null);
          setWidgetSettings(null);
          setVapiSecrets(null);
          setStoredSlug(slug);
          setSessionValid(false);
          setStep("settings");
          return;
        }

        // If no session exists, they need to sign in
        if (!contactSessionId) {
          setSessionValid(false);
          setStep("settings");
          return;
        }

        setLoadingMessage("Checking your saved conversation...");

        // Ask the backend if the saved session is still good
        const result = await validateContactSession({ contactSessionId, slug });
        setSessionValid(!!result?.valid);
        if (!result?.valid) {
          setContactSessionId(null);
          setConversationId(null);
        }
        setStep("settings");
      } catch (error) {
        console.error("Error during initialization:", error);
        setErrorMessage("Failed to initialize contact session.");
        setScreen("error");
      } finally {
        setLoadingMessage(null);
      }
    };

    init();
  }, [
    contactSessionId,
    slug,
    storedSlug,
    validateContactSession,
    setContactSessionId,
    setConversationId,
    setErrorMessage,
    setLoadingMessage,
    setScreen,
    setStoredSlug,
    setVapiSecrets,
    setWidgetSettings,
  ]);

  /**
   * STEP 2: Load Widget Settings
   * Fetches the organization's custom branding, greeting message, and settings.
   */
  const widgetSettings = useQuery(
    api.public.widgetSettings.get,
    slug ? { slug } : "skip"
  );

  useEffect(() => {
    if (step !== "settings") return;

    if (!slug) {
      setErrorMessage("Missing widget slug. Cannot load settings.");
      setScreen("error");
      return;
    }

    if (widgetSettings === undefined) {
      setLoadingMessage("Personalizing your widget...");
      return;
    }

    if (widgetSettings === null) {
      setErrorMessage("Widget settings not found.");
      setScreen("error");
      return;
    }

    // Save the settings and move to the next step
    setWidgetSettings(widgetSettings);
    setStep("vapi");
    setLoadingMessage(null);
  }, [step, slug, widgetSettings, setWidgetSettings, setLoadingMessage, setErrorMessage, setScreen]);

  /**
   * STEP 3: Load Vapi Secrets
   * If the organization has voice chat enabled, we need to fetch the 
   * public API keys to initialize the voice system.
   */
  const getVapiSecrets = useAction(api.public.secrets.getVapiSecrets);

  useEffect(() => {
    if (step !== "vapi") return;

    setLoadingMessage("Checking voice options...");

    if (!widgetSettings) {
      setStep("done");
      return;
    }

    getVapiSecrets({ organizationId: widgetSettings.organizationId })
      .then((secrets) => {
        setVapiSecrets(secrets);
      })
      .catch(() => {
        setVapiSecrets(null);
      })
      .finally(() => {
        setStep("done");
        setLoadingMessage(null);
      });
  }, [step, widgetSettings, getVapiSecrets, setVapiSecrets, setStep, setLoadingMessage]);

  /**
   * STEP 4: Final Navigation
   * Now that everything is loaded, we decide which screen to show the user.
   * If they have a valid session, show their chats ("selection").
   * Otherwise, show the contact form ("auth").
   */
  useEffect(() => {
    if (step !== "done") return;
    setScreen(sessionValid ? "selection" : "auth");
  }, [step, sessionValid, setScreen]);

  return (
    <div className="flex flex-col h-full">
      {/* Header showing the organization name and welcome message */}
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-4 font-semibold">
          <p className="text-2xl">{formatViviaOrganizationName(widgetSettings?.organizationName)}</p>
          <p className="text-lg">{widgetSettings?.greetMessage || "We are getting everything ready for you."}</p>
        </div>
      </WidgetHeader>

      {/* Loading Spinner and Status Text */}
      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">
          {step === "session" && "Preparing your conversation..."}
          {step === "settings" && "Loading your support experience..."}
          {step === "vapi" && "Checking voice support..."}
          {step === "done" && "Almost there..."}
        </p>
      </div>
    </div>
  );
};
