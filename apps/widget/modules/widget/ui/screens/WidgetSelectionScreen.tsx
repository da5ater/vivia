"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  errorMessageAtom,
  contactSessionIdAtom,
  conversationIdAtom,
  widgetSettingsAtom,
  hasVapiSecretsAtom,
} from "../../atoms/widget-atoms";
import { WidgetHeader } from "../components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { ChevronRightIcon, MessageSquareTextIcon, MicIcon, PhoneIcon } from "lucide-react";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { useState } from "react";
import { WidgetFooter } from "../components/widget-footer";
import { formatViviaOrganizationName } from "../../lib/branding";

export const WidgetSelectionScreen = () => {
  const setScreen = useSetAtom(widgetScreenAtom);
  const contactSessionId = useAtomValue(contactSessionIdAtom);

  const createConversation = useMutation(api.public.conversations.create);

  const [isPending, setIsPending] = useState(false);
  const widgetSettings = useAtomValue(widgetSettingsAtom);
  const hasVapiSecrets = useAtomValue(hasVapiSecretsAtom);

  const setConversationId = useSetAtom(conversationIdAtom);

  const handleNewConversation = async () => {
    setIsPending(true);
    if (!contactSessionId) {
      setScreen("auth");
      setIsPending(false);
      return;
    }

    try {
      const conversationId = await createConversation({
        contactSessionId,
      });
      console.log("New conversation created with ID:", conversationId);
      // You can add further actions here, like navigating to the chat screen
      setConversationId(conversationId);
      setScreen("chat");
    } catch (error) {
      setScreen("error");
      console.error("Error creating conversation:", error);
      // Handle error, e.g., show an error message to the user
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-1 py-2 font-semibold">
          <p className="text-xl leading-tight">
            {formatViviaOrganizationName(widgetSettings?.organizationName)}
          </p>
          <p className="text-sm font-normal leading-5 opacity-90">
            {widgetSettings?.greetMessage || "Hi there. How can we help today?"}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/15 bg-white/10 p-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">Support status</span>
            <span className="text-xs font-semibold">Ready to help</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 rounded-full border border-green-500/30">
             <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-bold text-green-200">Online</span>
          </div>
        </div>
      </WidgetHeader>

      <div className="flex flex-1 flex-col items-center gap-y-3 overflow-y-auto p-4 text-muted-foreground">
        <Button
          className="h-14 w-full justify-between rounded-lg"
          variant="outline"
          onClick={handleNewConversation}
        >
          <div className="flex items-center gap-x-2">
            <MessageSquareTextIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">Chat with us</span>
          </div>
          <ChevronRightIcon />
        </Button>
        {hasVapiSecrets && widgetSettings?.assistantId && (
          <Button
            className="h-14 w-full justify-between rounded-lg"
            variant="outline"
            onClick={() => setScreen("voice")}
          >
            <div className="flex items-center gap-x-2">
              <MicIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Start a voice call</span>
            </div>
            <ChevronRightIcon />
          </Button>
        )}
        {hasVapiSecrets && widgetSettings?.phoneNumber && (
          <Button
            className="h-14 w-full justify-between rounded-lg"
            variant="outline"
            onClick={() => setScreen("contact")}
          >
            <div className="flex items-center gap-x-2">
              <PhoneIcon className="h-5 w-5" />
              <span className="text-sm font-semibold">Call our team</span>
            </div>
            <ChevronRightIcon />
          </Button>
        )}
      </div>

      <WidgetFooter />
    </div>
  );
};
