"use client";

import { useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import Link from "next/link";
import {
  InboxIcon,
  LibraryBigIcon,
  PaletteIcon,
  LayoutDashboardIcon,
  Mic,
  CreditCardIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  ZapIcon,
  SparklesIcon,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useUser } from "@clerk/nextjs";

// ─── helpers ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── inline skeleton ────────────────────────────────────────────────────────

const InlineSkeleton = ({ className }: { className?: string }) => (
  <span className={cn("inline-block rounded-md bg-muted animate-pulse", className)} />
);

// ─── sub-components ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string | null;
  icon: React.ElementType;
  iconClassName?: string;
  bgClassName?: string;
  href: string;
}

const StatCard = ({ label, value, icon: Icon, iconClassName, bgClassName, href }: StatCardProps) => (
  <Link
    href={href}
    className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-border/80 hover:-translate-y-0.5"
  >
    <div className="flex items-center justify-between">
      <span
        className={cn("flex items-center justify-center size-10 rounded-[10px]", bgClassName)}
      >
        <Icon className={cn("size-5", iconClassName)} />
      </span>
      <ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
    </div>
    <div className="mt-1">
      {value === null ? (
        <InlineSkeleton className="w-12 h-8 mb-1" />
      ) : (
        <p
          className="text-3xl font-semibold tracking-tight text-foreground"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </p>
      )}
      <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  </Link>
);

interface QuickLinkProps {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  iconClassName?: string;
  bgClassName?: string;
}

const QuickLink = ({ label, description, href, icon: Icon, iconClassName, bgClassName }: QuickLinkProps) => (
  <Link
    href={href}
    className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 transition-all duration-200 hover:shadow-sm hover:border-border/80 hover:-translate-y-0.5"
  >
    <span
      className={cn("flex items-center justify-center size-9 rounded-[9px] shrink-0", bgClassName)}
    >
      <Icon className={cn("size-4", iconClassName)} />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground leading-none">{label}</p>
      <p className="text-[12px] text-muted-foreground mt-1.5 truncate">{description}</p>
    </div>
    <ArrowRightIcon className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors duration-200" />
  </Link>
);

type ConvStatus = "unresolved" | "resolved" | "escalated";

const statusConfig: Record<
  ConvStatus,
  { label: string; textClass: string; bgClass: string; icon: React.ElementType }
> = {
  unresolved: { label: "Open", textClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-100 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20", icon: ClockIcon },
  resolved: { label: "Resolved", textClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-100 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20", icon: CheckCircle2Icon },
  escalated: { label: "Escalated", textClass: "text-red-600 dark:text-red-400", bgClass: "bg-red-100 dark:bg-red-400/10 border-red-200 dark:border-red-400/20", icon: AlertCircleIcon },
};

// ─── main view ──────────────────────────────────────────────────────────────

export const DashboardView = () => {
  const { user } = useUser();

  // Fetch overall stats
  const stats = useQuery(api.private.conversations.getStats);

  // Fetch only recent 5 conversations
  const recentConvsQuery = useQuery(api.private.conversations.getMany, {
    paginationOpts: { numItems: 6, cursor: null },
  });

  // null = loading, number = loaded
  const totalCount = stats === undefined ? null : stats.total;
  const openCount = stats === undefined ? null : stats.unresolved;
  const resolvedCount = stats === undefined ? null : stats.resolved;
  const escalatedCount = stats === undefined ? null : stats.escalated;

  // recent 5
  const recentConvs = recentConvsQuery?.page ?? [];
  const isLoadingRecent = recentConvsQuery === undefined;


  return (
    <div className="flex flex-col flex-1 gap-8 max-w-7xl mx-auto w-full">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <SparklesIcon
            className="size-4 text-primary"
          />
          <p className="text-xs text-primary font-semibold tracking-wider uppercase">
            Overview
          </p>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          {greeting()}
          {user?.firstName ? ', ' + user.firstName : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what needs attention across your Vivia workspace.
        </p>
      </div>

      {/* ── Stats grid ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Conversations"
          value={totalCount}
          icon={InboxIcon}
          href="/conversations"
          bgClassName="bg-indigo-100 dark:bg-indigo-500/20"
          iconClassName="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label="Open / Unresolved"
          value={openCount}
          icon={ClockIcon}
          href="/conversations"
          bgClassName="bg-amber-100 dark:bg-amber-500/20"
          iconClassName="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon={CheckCircle2Icon}
          href="/conversations"
          bgClassName="bg-emerald-100 dark:bg-emerald-500/20"
          iconClassName="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Escalated"
          value={escalatedCount}
          icon={AlertCircleIcon}
          href="/conversations"
          bgClassName="bg-red-100 dark:bg-red-500/20"
          iconClassName="text-red-600 dark:text-red-400"
        />
      </section>

      {/* ── Body: recent activity + quick links ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* Recent conversations */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              Recent Conversations
            </h2>
            <Link
              href="/conversations"
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>

          <div
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            {isLoadingRecent ? (
              /* Loading skeletons */
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-4 border-b border-border/50 last:border-0"
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="inline-block w-32 h-3.5 rounded bg-muted animate-pulse" />
                    <span className="inline-block w-20 h-2.5 rounded bg-muted/70 animate-pulse" />
                  </div>
                  <span className="inline-block w-16 h-6 rounded-full bg-muted animate-pulse" />
                </div>
              ))
            ) : recentConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-2">
                  <ZapIcon className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">No conversations yet</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  They&apos;ll appear here once your widget starts getting traffic.
                </p>
              </div>
            ) : (
              recentConvs.map((conv, idx: number) => {
                const s =
                  statusConfig[conv.status as ConvStatus] ?? statusConfig.unresolved;
                const StatusIcon = s.icon;
                const name = conv.contactSession?.name ?? "Anonymous";
                const email = conv.contactSession?.email ?? "";
                const initials = name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <Link
                    key={conv._id}
                    href={`/conversations/${conv._id}`}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/40",
                      idx < recentConvs.length - 1 && "border-b border-border/50"
                    )}
                  >
                    {/* Avatar */}
                    <span
                      className="flex items-center justify-center size-9 rounded-full shrink-0 text-xs font-semibold text-primary bg-primary/10 border border-primary/20"
                    >
                      {initials}
                    </span>

                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{email}</p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                        s.textClass,
                        s.bgClass
                      )}
                    >
                      <StatusIcon className="size-3" />
                      {s.label}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Quick links */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Quick Navigation
          </h2>
          <div className="flex flex-col gap-3">
            <QuickLink
              label="Knowledge Base"
              description="Upload & manage files"
              href="/files"
              icon={LibraryBigIcon}
              bgClassName="bg-violet-100 dark:bg-violet-500/20"
              iconClassName="text-violet-600 dark:text-violet-400"
            />
            <QuickLink
              label="Widget Customization"
              description="Brand your support widget"
              href="/customization"
              icon={PaletteIcon}
              bgClassName="bg-pink-100 dark:bg-pink-500/20"
              iconClassName="text-pink-600 dark:text-pink-400"
            />
            <QuickLink
              label="Integrations"
              description="Connect your tools"
              href="/integrations"
              icon={LayoutDashboardIcon}
              bgClassName="bg-blue-100 dark:bg-blue-500/20"
              iconClassName="text-blue-600 dark:text-blue-400"
            />
            <QuickLink
              label="Voice Assistant"
              description="Configure VAPI settings"
              href="/plugins/vapi"
              icon={Mic}
              bgClassName="bg-teal-100 dark:bg-teal-500/20"
              iconClassName="text-teal-600 dark:text-teal-400"
            />
            <QuickLink
              label="Billing"
              description="Manage your subscription"
              href="/billing"
              icon={CreditCardIcon}
              bgClassName="bg-orange-100 dark:bg-orange-500/20"
              iconClassName="text-orange-600 dark:text-orange-400"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
