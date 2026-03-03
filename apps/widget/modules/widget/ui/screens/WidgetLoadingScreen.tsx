"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { api } from "@workspace/backend/convex/_generated/api";
import { WidgetHeader } from "../components/widget-header";
import { Loader2 } from "lucide-react";
import {
  contactSessionIdAtom,
  errorMessageAtom,
  loadingMessageAtom,
  widgetScreenAtom,
  widgetSettingsAtom,
} from "../../atoms/widget-atoms";
import { useMutation, useQuery } from "convex/react";

type InitStep = "session" | "settings" | "vapi" | "done";

export const WidgetLoadingScreen = () => {
  const [step, setStep] = useState<InitStep>("session");
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  const setErrorMessage = useSetAtom(errorMessageAtom);
  const setScreen = useSetAtom(widgetScreenAtom);
  const setLoadingMessage = useSetAtom(loadingMessageAtom);
  const setWidgetSettings = useSetAtom(widgetSettingsAtom);

  const contactSessionId = useAtomValue(contactSessionIdAtom);

  const validateContactSession = useMutation(
    api.public.contact_sessions.validate
  );

  // 1) Validate contact session (or mark invalid if missing)
  useEffect(() => {
    const init = async () => {
      try {
        setLoadingMessage("Initializing contact session...");

        if (!contactSessionId) {
          setSessionValid(false);
          setStep("settings");
          return;
        }

        setLoadingMessage("Validating contact session...");

        const result = await validateContactSession({ contactSessionId });
        setSessionValid(!!result?.valid);
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
    validateContactSession,
    setErrorMessage,
    setLoadingMessage,
    setScreen,
  ]);

  // 2) Load widget settings (single-tenant: no args)
  const widgetSettings = useQuery(api.public.widgetSettings.get);

  useEffect(() => {
    if (step !== "settings") return;

    // still loading
    if (widgetSettings === undefined) {
      setLoadingMessage("Loading settings...");
      return;
    }

    // widgetSettings is now either object or null
    setWidgetSettings(widgetSettings);
    setStep("done");
    setLoadingMessage(null);
  }, [step, widgetSettings, setWidgetSettings, setLoadingMessage]);

  // 3) Move to next screen
  useEffect(() => {
    if (step !== "done") return;
    setScreen(sessionValid ? "selection" : "auth");
  }, [step, sessionValid, setScreen]);

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">we are here to help you</p>
          <p className="text-lg">lets get started</p>
        </div>
      </WidgetHeader>

      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">
          {step === "session" && "Setting up your contact session..."}
          {step === "settings" && "Loading settings..."}
          {step === "vapi" && "Connecting to Vapi..."}
          {step === "done" && "Almost there..."}
        </p>
      </div>
    </div>
  );
};