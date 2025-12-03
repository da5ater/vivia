"use client";

import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { api } from "@workspace/backend/convex/_generated/api";
import { WidgetHeader } from "../components/widget-header";
import { Loader2 } from "lucide-react";
import {
  contactSessionAtom,
  errorMessageAtom,
  loadingMessageAtom,
  widgetScreenAtom,
} from "../../atoms/widget-atoms";
import { useMutation } from "convex/react";

type InitStep = "session" | "settings" | "vappy" | "done";

export const WidgetLoadingScreen = () => {
  const [Step, setStep] = useState<InitStep>("session");
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  const setErrorMessage = useSetAtom(errorMessageAtom);
  const setScreen = useSetAtom(widgetScreenAtom);
  const setLoadingMessage = useSetAtom(loadingMessageAtom);

  const contactSessionId = useAtomValue(contactSessionAtom);

  const useMutationValidateContactSession = useMutation(
    api.public.contact_sessions.validate
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingMessage("Initializing contact session...");
        if (!contactSessionId) {
          setSessionValid(null);
          setStep("done");
          return;
        }

        setLoadingMessage("Validating contact session...");

        const result = await useMutationValidateContactSession({
          contactSessionId,
        });
        if (result.valid) {
          setSessionValid(true);
          setStep("done");
        } else {
          setSessionValid(false);
          setStep("done");
        }
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
    setErrorMessage,
    setLoadingMessage,
    setScreen,
    useMutationValidateContactSession,
  ]);

  useEffect(() => {
    if (Step === "done") {
      setScreen(sessionValid ? "selection" : "auth");
    }
  }, [Step, sessionValid, setScreen]);

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
          {Step === "session" && "Setting up your contact session..."}
          {Step === "settings" && "Loading settings..."}
          {Step === "vappy" && "Connecting to Vappy..."}
          {Step === "done" && "Almost there..."}
        </p>
      </div>
    </div>
  );
};
