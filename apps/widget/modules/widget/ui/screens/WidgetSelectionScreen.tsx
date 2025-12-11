"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  errorMessageAtom,
  contactSessionIdAtom,
  conversationIdAtom,
} from "../../atoms/widget-atoms";
import { WidgetHeader } from "../components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { ChevronRightIcon, MessageSquareTextIcon } from "lucide-react";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { useState } from "react";
import { WidgetFooter } from "../components/widget-footer";

export const WidgetSelectionScreen = () => {
  const setScreen = useSetAtom(widgetScreenAtom);
  const contactSessionId = useAtomValue(contactSessionIdAtom);

  const createConversation = useMutation(api.public.conversations.create);

  const [isPending, setIsPending] = useState(false);

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
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">we are here to help you</p>
          <p className="text-lg">lets get started</p>
        </div>
      </WidgetHeader>

      <div className="flex flex-1 flex-col items-center  gap-y-4 p-4 text-muted-foreground overflow-y-auto">
        <Button
          className="h-16 w-full justify-between"
          variant="outline"
          onClick={handleNewConversation}
        >
          <div className="flex items-center gap-x-2">
            <MessageSquareTextIcon className="h-6 w-6" />
            <span className="text-lg font-medium">Start a Chat</span>
          </div>
          <ChevronRightIcon />
        </Button>
      </div>

      <WidgetFooter />
    </div>
  );
};
