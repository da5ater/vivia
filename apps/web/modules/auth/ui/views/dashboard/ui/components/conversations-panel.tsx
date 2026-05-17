"use client";

import { type ElementType, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  ArrowUpIcon,
  CheckIcon,
  CornerUpLeftIcon,
  InboxIcon,
  MessagesSquareIcon,
  SearchIcon,
} from "lucide-react";

import { api } from "@workspace/backend/convex/_generated/api";
import { Doc } from "@workspace/backend/convex/_generated/dataModel";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { cn } from "@workspace/ui/lib/utils";
import {
  conversationStatusMeta,
  type ConversationStatus,
} from "@/components/conversation-status-badge";
import {
  getCountryFlagUrl,
  getCountryNameFromTimzezone,
} from "../../../../../../../lib/country-utils";
import { statusFilterAtom } from "../../atoms";

type FilterValue = Doc<"conversations">["status"] | "all";

const FILTER_TABS: {
  value: FilterValue;
  label: string;
  icon: ElementType;
}[] = [
  { value: "all", label: "All", icon: MessagesSquareIcon },
  { value: "unresolved", label: "Open", icon: InboxIcon },
  { value: "escalated", label: "Escalated", icon: ArrowUpIcon },
  { value: "resolved", label: "Resolved", icon: CheckIcon },
];

const getInitials = (name?: string | null) =>
  (name || "Anonymous")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const FilterButton = ({
  tab,
  selected,
  count,
  onClick,
}: {
  tab: (typeof FILTER_TABS)[number];
  selected: boolean;
  count?: number;
  onClick: () => void;
}) => {
  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition-colors",
        selected
          ? "border-sky-500/30 bg-sky-600 text-white shadow-xs dark:border-sky-400/25 dark:bg-sky-500/15 dark:text-sky-100"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      <span>{tab.label}</span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
            selected
              ? "bg-white/15 text-white dark:bg-sky-100/10 dark:text-sky-100"
              : "bg-background text-muted-foreground"
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
};

export const ConversationsPanel = () => {
  const statusFilter = useAtomValue(statusFilterAtom) || "all";
  const setStatusFilter = useSetAtom(statusFilterAtom);
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  const stats = useQuery(api.private.conversations.getStats);
  const { results, status, loadMore } = usePaginatedQuery(
    api.private.conversations.getMany,
    { status: statusFilter === "all" ? undefined : statusFilter },
    { initialNumItems: 14 }
  );

  const { topElementRef, canLoadMore, isLoadingMore, isLoadingFirstPage } =
    useInfiniteScroll({ status, loadMore, loadSize: 8 });

  const counts: Record<FilterValue, number | undefined> = {
    all: stats?.total,
    unresolved: stats?.unresolved,
    escalated: stats?.escalated,
    resolved: stats?.resolved,
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return results;

    return results.filter((conversation) => {
      const name = conversation.contactSession?.name || "Anonymous";
      const email = conversation.contactSession?.email || "";
      const preview = conversation.lastMessage?.text || "";

      return [name, email, preview].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [results, search]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-border/60 bg-background text-foreground">
      <div className="shrink-0 border-b border-border/60 px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Conversation Queue
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prioritize visitor replies and open work.
            </p>
          </div>
          {typeof counts.all === "number" ? (
            <span className="rounded-full border border-border bg-muted/50 px-2 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
              {counts.all}
            </span>
          ) : null}
        </div>

        <div className="relative mb-3">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/65" />
          <Input
            placeholder="Search by visitor, email, or message"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 rounded-md border-border/70 bg-muted/40 pl-8 text-[13px] focus-visible:bg-background"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <FilterButton
              key={tab.value}
              tab={tab}
              count={counts[tab.value]}
              selected={statusFilter === tab.value}
              onClick={() => setStatusFilter(tab.value)}
            />
          ))}
        </div>
      </div>

      {isLoadingFirstPage ? (
        <SkeletonConversations />
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/50">
            <InboxIcon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No conversations found
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {search
                ? "Try a different visitor name, email, or message."
                : "New visitor conversations will appear here."}
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col">
            {filtered.map((conversation) => {
              const status =
                (conversation.status as ConversationStatus) || "unresolved";
              const statusMeta =
                conversationStatusMeta[status] ??
                conversationStatusMeta.unresolved;
              const countryInfo = getCountryNameFromTimzezone(
                conversation.contactSession?.metadata?.timezone || ""
              );
              const countryFlagUrl = countryInfo
                ? getCountryFlagUrl(countryInfo.code)
                : undefined;
              const isVisitorReply =
                conversation.lastMessage?.provider === "user";
              const isActive =
                pathname === `/conversations/${conversation._id}`;
              const name = conversation.contactSession?.name || "Anonymous";
              const preview =
                conversation.lastMessage?.text || "No messages yet";

              return (
                <Link
                  key={conversation._id}
                  href={`/conversations/${conversation._id}`}
                  className={cn(
                    "group relative flex gap-3 border-b border-border/50 px-4 py-3.5 outline-none transition-colors",
                    "hover:bg-muted/55 focus-visible:bg-muted/55",
                    isActive && "bg-sky-500/8 dark:bg-sky-500/10"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-sky-500 transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <div className="relative mt-0.5 shrink-0">
                    <DiceBearAvatar
                      seed={conversation.contactSession?._id || name}
                      size={40}
                      className={cn(
                        "ring-1 transition-colors",
                        isActive
                          ? "ring-sky-500/45"
                          : "ring-border group-hover:ring-sky-500/30"
                      )}
                      badgeImageUrl={countryFlagUrl}
                    />
                    {isVisitorReply && !isActive ? (
                      <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-sky-500" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-[13.5px] tracking-tight",
                            isVisitorReply
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/85"
                          )}
                        >
                          {name}
                        </p>
                        {conversation.contactSession?.email ? (
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                            {conversation.contactSession.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10.5px] font-medium tabular-nums text-muted-foreground/65">
                        {formatDistanceToNow(
                          new Date(
                            conversation.lastMessage?._creationTime ??
                              conversation._creationTime
                          ),
                          { addSuffix: true }
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {!isVisitorReply && conversation.lastMessage ? (
                          <CornerUpLeftIcon className="size-3 shrink-0 text-sky-500/75" />
                        ) : null}
                        <span
                          className={cn(
                            "line-clamp-1 text-xs",
                            isVisitorReply
                              ? "font-medium text-foreground/75"
                              : "text-muted-foreground"
                          )}
                        >
                          {preview}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          statusMeta.className
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            statusMeta.dotClassName
                          )}
                        />
                        {statusMeta.label}
                      </span>
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
            onLoadMore={() => loadMore(8)}
          />
        </div>
      )}
    </div>
  );
};

export const SkeletonConversations = () => (
  <div className="flex flex-1 flex-col overflow-hidden">
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={index}
        className="flex items-start gap-3.5 border-b border-border/50 px-4 py-3.5"
      >
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>
      </div>
    ))}
  </div>
);
