"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { WidgetHeader } from "../components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, ArrowLeftIcon, MenuIcon } from "lucide-react";
import {
  conversationIdAtom,
  contactSessionIdAtom,
  widgetScreenAtom,
} from "../../atoms/widget-atoms";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";

export const WidgetChatScreen = () => {
  const conversationId = useAtomValue(conversationIdAtom);
  const contactSessionId = useAtomValue(contactSessionIdAtom);
  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId
      ? {
          conversationId,
          contactSessionId,
        }
      : "skip"
  );

  const setScreen = useSetAtom(widgetScreenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);

  const handleBackToChat = () => {
    setConversationId(null);
    setScreen("selection");
  };

  return (
    <>
      <WidgetHeader className="flex items-center justify-between ">
        <div className="flex items-center gap-x-2 ">
          <Button size="icon" variant="transparent" onClick={handleBackToChat}>
            <ArrowLeftIcon />
            <p>Chat</p>
          </Button>
        </div>
        <Button size="icon" variant="transparent">
          <MenuIcon />
        </Button>
      </WidgetHeader>
      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        {JSON.stringify(conversation, null, 2)}
      </div>
    </>
  );
};
