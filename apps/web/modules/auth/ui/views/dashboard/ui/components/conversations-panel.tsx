"use client";

import { type ElementType, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ArrowUpIcon,
  CheckIcon,
  CornerUpLeftIcon,
  InboxIcon,
  MessagesSquareIcon,
  SearchIcon,
  GlobeIcon,
  PhoneCallIcon,
  MessageCircleIcon,
  BarChart3Icon,
  FilterIcon,
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
import { statusFilterAtom, channelFilterAtom } from "../../atoms";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";

type StatusFilterValue = Doc<"conversations">["status"] | "all";
type ChannelFilterValue = "all" | "web" | "whatsapp" | "messenger";

const STATUS_TABS: {
  value: StatusFilterValue;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "unresolved", label: "Open" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

export const ConversationsPanel = () => {
  const statusFilter = useAtomValue(statusFilterAtom) || "all";
  const setStatusFilter = useSetAtom(statusFilterAtom);
  const [channelFilter, setChannelFilter] = useAtom(channelFilterAtom);
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

  const counts: Record<StatusFilterValue, number | undefined> = {
    all: stats?.total,
    unresolved: stats?.unresolved,
    escalated: stats?.escalated,
    resolved: stats?.resolved,
  };

  const filtered = useMemo(() => {
    let filteredResults = results;

    // Filter by channel
    if (channelFilter !== "all") {
      filteredResults = filteredResults.filter((conv) => {
        const meta = conv.contactSession?.metadata;
        if (channelFilter === "whatsapp") return !!meta?.whatsappFrom;
        if (channelFilter === "messenger") return !!meta?.messengerId;
        if (channelFilter === "web") return !meta?.whatsappFrom && !meta?.messengerId;
        return true;
      });
    }

    // Filter by search
    const query = search.trim().toLowerCase();
    if (!query) return filteredResults;

    return filteredResults.filter((conversation) => {
      const name = conversation.contactSession?.name || "Anonymous";
      const email = conversation.contactSession?.email || "";
      const preview = conversation.lastMessage?.text || "";

      return [name, email, preview].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [results, search, channelFilter]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-border/60 bg-background text-foreground">
      <div className="shrink-0 border-b border-border/60 px-4 py-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight">
              Inbox
            </h2>
            {typeof counts.all === "number" ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {counts.all}
              </span>
            ) : null}
          </div>
          
          {stats && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:bg-muted">
                  <BarChart3Icon className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4 shadow-xl border-border/60 rounded-xl">
                <h3 className="font-semibold text-sm mb-3">Traffic Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">By Channel</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between bg-muted/40 p-1.5 rounded-md"><span className="flex items-center gap-1.5"><GlobeIcon className="size-3 text-muted-foreground"/> Web</span><span className="font-medium">{stats.channelStats?.web || 0}</span></div>
                      <div className="flex justify-between bg-muted/40 p-1.5 rounded-md"><span className="flex items-center gap-1.5"><PhoneCallIcon className="size-3 text-emerald-500"/> WA</span><span className="font-medium">{stats.channelStats?.whatsapp || 0}</span></div>
                      <div className="flex justify-between bg-muted/40 p-1.5 rounded-md"><span className="flex items-center gap-1.5"><MessageCircleIcon className="size-3 text-blue-500"/> MS</span><span className="font-medium">{stats.channelStats?.messenger || 0}</span></div>
                    </div>
                  </div>
                  {stats.countryStats && Object.keys(stats.countryStats).length > 0 && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">Top Destinations</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(stats.countryStats)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([tz, count]) => {
                            const country = getCountryNameFromTimzezone(tz);
                            return (
                              <div key={tz} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                                <span className="flex items-center gap-2 text-xs truncate max-w-[140px]">
                                  {country ? (
                                    <img src={getCountryFlagUrl(country.code)} alt="" className="w-4 h-3 object-cover rounded-sm" />
                                  ) : <GlobeIcon className="size-3 text-muted-foreground" />}
                                  {country?.name || tz}
                                </span>
                                <span className="font-medium text-xs bg-muted px-1.5 rounded-full">{count}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Search & Channel Filter Row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/65" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 rounded-md border-border/60 bg-muted/30 pl-8 text-[13px] focus-visible:bg-background transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as ChannelFilterValue)}
              className="h-8 appearance-none rounded-md border border-border/60 bg-muted/30 pl-8 pr-6 text-[12px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="web">Web Chat</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="messenger">Messenger</option>
            </select>
            <FilterIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Status Tabs Row */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
          {STATUS_TABS.map((tab) => {
            const isSelected = statusFilter === tab.value;
            const count = counts[tab.value];
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "relative flex flex-1 h-7 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors",
                  isSelected
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                {typeof count === "number" && (
                  <span className={cn("ml-0.5 text-[10px]", isSelected ? "text-background/80" : "text-muted-foreground/60")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoadingFirstPage ? (
        <SkeletonConversations />
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted/50">
            <InboxIcon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Inbox is empty
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground max-w-[180px] mx-auto">
              {search || channelFilter !== "all"
                ? "No messages match your current filters."
                : "You're all caught up! New messages will appear here."}
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
              const meta = conversation.contactSession?.metadata;
              const countryInfo = getCountryNameFromTimzezone(
                meta?.timezone || ""
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
              
              const isWhatsApp = !!meta?.whatsappFrom;
              const isMessenger = !!meta?.messengerId;

              return (
                <Link
                  key={conversation._id}
                  href={`/conversations/${conversation._id}`}
                  className={cn(
                    "group relative flex gap-3 border-b border-border/40 px-4 py-3 outline-none transition-colors",
                    "hover:bg-muted/40",
                    isActive && "bg-sky-50/50 dark:bg-sky-950/20"
                  )}
                >
                  <span
                    className={cn(
                      "absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-sky-500 transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <div className="relative mt-1 shrink-0">
                    <DiceBearAvatar
                      seed={conversation.contactSession?._id || name}
                      size={36}
                      className={cn(
                        "transition-all",
                        isActive ? "ring-2 ring-sky-500/30 ring-offset-1 ring-offset-background" : ""
                      )}
                      imageUrl={conversation.contactSession?.metadata?.avatarUrl}
                      badgeImageUrl={countryFlagUrl}
                    />
                    {isVisitorReply && !isActive ? (
                      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-sky-500" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isWhatsApp ? (
                            <PhoneCallIcon className="size-3 text-emerald-500 shrink-0" />
                          ) : isMessenger ? (
                            <MessageCircleIcon className="size-3 text-blue-500 shrink-0" />
                          ) : (
                            <GlobeIcon className="size-3 text-muted-foreground/60 shrink-0" />
                          )}
                          <p
                            className={cn(
                              "truncate text-[13px] tracking-tight",
                              isVisitorReply
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80"
                            )}
                          >
                            {name}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 pt-0.5">
                        {formatDistanceToNow(
                          new Date(
                            conversation.lastMessage?._creationTime ??
                              conversation._creationTime
                          ),
                          { addSuffix: false } // e.g. "5m" instead of "5m ago" is cleaner but let's just keep default for now
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {!isVisitorReply && conversation.lastMessage ? (
                          <CornerUpLeftIcon className="size-3 shrink-0 text-muted-foreground/50" />
                        ) : null}
                        <span
                          className={cn(
                            "line-clamp-1 text-[12px]",
                            isVisitorReply
                              ? "font-medium text-foreground/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {preview}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          status === "escalated" ? "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10" :
                          status === "resolved" ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10" :
                          "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10"
                        )}
                      >
                        {status === "unresolved" ? "Open" : status}
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
        className="flex items-start gap-3 border-b border-border/40 px-4 py-3"
      >
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-2 w-10 rounded" />
          </div>
          <Skeleton className="h-2.5 w-4/5 rounded" />
        </div>
      </div>
    ))}
  </div>
);
