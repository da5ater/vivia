"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { WidgetHeader } from "../components/widget-header";
import { WidgetFooter } from "../components/widget-footer";
import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import {
  contactSessionIdAtom,
  conversationIdAtom,
  widgetScreenAtom,
} from "../../atoms/widget-atoms";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeftIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";

export const WidgetInboxScreen = () => {
  const contactSessionId = useAtomValue(contactSessionIdAtom);
  const setConversationId = useSetAtom(conversationIdAtom);
  const setScreen = useSetAtom(widgetScreenAtom);

  const { results, status, loadMore } = usePaginatedQuery(
    api.public.conversations.getMany,
    contactSessionId ? { contactSessionId } : "skip",
    { initialNumItems: 10 }
  );

  const { topElementRef, canLoadMore, isLoadingMore } = useInfiniteScroll({
    status: status,
    loadMore: loadMore,
    loadSize: 5,
    observerEnabled: false,
  });

  return (
    <div className="flex flex-col h-full flex-1">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">we are here to help you</p>
          <p className="text-lg">lets get started</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setScreen("selection");
          }}
        >
          <ArrowLeftIcon className="size-5" />
        </Button>
      </WidgetHeader>

      <div className="flex flex-1 flex-col gap-y-2">
        {results?.map((conversation) => (
          <Button
            key={conversation._id}
            variant="outline"
            className="justify-between w-full h-20"
            onClick={() => {
              setConversationId(conversation._id);
              setScreen("chat");
            }}
          >
            <div className="flex flex-col text-start w-full gap-4 overflow-hidden">
              <div className="flex w-full items-center justify-between gap-x-2">
                <p className="text-xs text-muted-foreground"> Chat </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(
                      conversation.lastMessage?._creationTime || Date.now()
                    ),
                    { addSuffix: true }
                  )}
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-x-2">
                <p className="truncate text-sm">
                  {conversation.lastMessage?.text || "No messages"}
                </p>
                <ConversationStatusIcon status={conversation.status} />
              </div>
            </div>
          </Button>
        ))}

        <InfiniteScrollTrigger
          ref={topElementRef} // Hook attaches here
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => loadMore(10)}
        />
      </div>

      <WidgetFooter />
    </div>
  );
};
