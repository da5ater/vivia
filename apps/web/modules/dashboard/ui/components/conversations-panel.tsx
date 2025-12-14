"use client";

import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

import {
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  CornerUpLeftIcon,
  ListIcon,
} from "lucide-react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  getCountryFlagUrl,
  getCountryNameFromTimzezone,
} from "../../../../lib/country-utils";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { cn } from "@workspace/ui/lib/utils";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useAtomValue, useSetAtom } from "jotai";
import { stat } from "fs";
import { statusFilterAtom } from "../../atoms";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import { Skeleton } from "@workspace/ui/components/skeleton";

export const ConversationsPanel = () => {
  const statusFilter = useAtomValue(statusFilterAtom);
  const setStatusFilter = useSetAtom(statusFilterAtom);

  const { results, status, loadMore } = usePaginatedQuery(
    api.private.conversations.getMany,
    { status: statusFilter === "all" ? undefined : statusFilter },
    { initialNumItems: 10 }
  );

  const pathname = usePathname();

  const { topElementRef, canLoadMore, isLoadingMore, isLoadingFirstPage } =
    useInfiniteScroll({ status, loadMore, loadSize: 5 });

  return (
    <div className="flex h-full flex-col bg-background  text-sidebar-foreground ">
      <div className="flex flex-col gap-3.5 border-b p-2">
        <Select
          defaultValue="all"
          onValueChange={(value) =>
            setStatusFilter(
              value as "all" | "unresolved" | "resolved" | "escalated"
            )
          }
          value={statusFilter || "all"}
        >
          <SelectTrigger className="h-8 border-none px-1.5 shadow-none ring-0 hover:bg-accent hover:text-accent-foreground focus-visible:ring-0">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <ListIcon className="size-4" />
                <span>All</span>
              </div>
            </SelectItem>
            <SelectItem value="unresolved">
              <div className="flex items-center gap-2">
                <ArrowRightIcon className="size-4" />
                <span>Unresolved</span>
              </div>
            </SelectItem>
            <SelectItem value="escalated">
              <div className="flex items-center gap-2">
                <ArrowUpIcon className="size-4" />
                <span>Escalated</span>
              </div>
            </SelectItem>
            <SelectItem value="resolved">
              <div className="flex items-center gap-2">
                <CheckIcon className="size-4" />
                <span>Resolved</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List Section */}
      {isLoadingFirstPage ? (
        <SkeletonConversations />
      ) : (
        <ScrollArea className="max-h-[calc(100vh-53px)]">
          <div className="flex w-full flex-1 flex-col text-sm">
            {results.map((conversation) => {
              const countryInfo = getCountryNameFromTimzezone(
                conversation.contactSession?.metadata?.timezone || ""
              );

              const countryFlagUrl = countryInfo
                ? getCountryFlagUrl(countryInfo?.code)
                : undefined;

              const isLastMessageFromOperator =
                conversation.lastMessage?.provider !== "user";

              const isActive =
                pathname === `/conversations/${conversation._id}`;

              return (
                <Link
                  key={conversation._id}
                  href={`/conversations/${conversation._id}`}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 border-b p-4 py-5 text-sm leading-tight hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  {/* Active State Vertical Indicator */}
                  <div
                    className={cn(
                      "absolute top-1.5 left-0 h-[64%] w-1 -translate-y-1.5 rounded-r-full bg-neutral-300 opacity-0 transition-opacity",
                      isActive && "opacity-100"
                    )}
                  />

                  {/* User Avatar with Country Flag Badge */}
                  <DiceBearAvatar
                    seed={conversation.contactSession?._id}
                    size={40}
                    className="shrink-0"
                    badgeImageUrl={countryFlagUrl} // Passing the flag here
                  />

                  <div className="flex flex-1 flex-col">
                    {/* Name and Time Row */}
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate font-bold">
                        {conversation.contactSession?.name || "Anonymous"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(
                          new Date(conversation._creationTime)
                        )}
                      </span>
                    </div>

                    {/* Message Preview Row */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 grow items-center gap-1">
                        {isLastMessageFromOperator && (
                          <CornerUpLeftIcon className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "line-clamp-1 text-xs text-muted-foreground",
                            !isLastMessageFromOperator && "font-bold text-black" // Bolds if user is waiting
                          )}
                        >
                          {conversation.lastMessage?.text || "No messages"}
                        </span>
                      </div>

                      {/* Status Icon */}
                      <ConversationStatusIcon status={conversation.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <InfiniteScrollTrigger
            ref={topElementRef}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => loadMore(5)}
          />
        </ScrollArea>
      )}
    </div>
  );
};

export const SkeletonConversations = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
      <div className="relative flex w-full min-w-0 flex-col p-2">
        <div className="w-full space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg p-4 last:border-b-0"
            >
              {/* Avatar Skeleton */}
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1">
                {/* Name & Date Row */}
                <div className="flex w-full items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-3 w-12 shrink-0" />
                </div>

                {/* Message Row */}
                <div className="mt-2">
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
