"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useConversationLayoutControls } from "@/modules/auth/ui/views/dashboard/ui/layouts/conversation-id-layout";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import Bowser from "bowser";
import {
  AppWindowIcon,
  CalendarIcon,
  CheckIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  Clock3Icon,
  ClockIcon,
  CookieIcon,
  CopyIcon,
  CpuIcon,
  ExternalLinkIcon,
  GlobeIcon,
  InfoIcon,
  LanguagesIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  MonitorIcon,
  MousePointerClickIcon,
  NavigationIcon,
  PanelRightCloseIcon,
  SendIcon,
  SmartphoneIcon,
  TimerIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { InfoPopover } from "@/components/info-popover";
import { api } from "@workspace/backend/convex/_generated/api";
import { Id } from "@workspace/backend/convex/_generated/dataModel";
import {
  getCountryFlagUrl,
  getCountryNameFromTimzezone,
} from "@/lib/country-utils";

type InfoRowProps = {
  label: string;
  value?: string | number | null;
  icon?: ReactNode;
  isLink?: boolean;
  help?: string;
};

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && !value.trim()) return null;
  return String(value);
};

const formatDateTime = (value?: number | string | null) => {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return null;
  }
};

const formatUtcOffsetFromTimezone = (timezone?: string | null) => {
  if (!timezone) return null;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const timeZoneName = formatter
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;

    return timeZoneName?.replace("GMT", "UTC") ?? null;
  } catch {
    return null;
  }
};

const InfoRow = ({ label, value, icon, isLink, help }: InfoRowProps) => {
  const formatted = formatValue(value);
  const [copied, setCopied] = useState(false);

  if (!formatted) return null;

  const handleCopy = async () => {
    if (!navigator?.clipboard) return;

    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="group grid grid-cols-[minmax(112px,0.8fr)_minmax(0,1fr)] gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/45">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span className="text-muted-foreground/70 transition-colors group-hover:text-primary">
            {icon}
          </span>
        ) : null}
        <span className="truncate text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {label}
        </span>
        {help ? (
          <InfoPopover title={label} className="-ml-1 size-5">
            {help}
          </InfoPopover>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1.5 text-right">
        {isLink ? (
          <a
            href={formatted}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center justify-end gap-1.5 text-sm font-semibold text-primary hover:underline"
            title={formatted}
          >
            <span className="truncate">{formatted}</span>
            <ExternalLinkIcon className="size-3.5 shrink-0" />
          </a>
        ) : (
          <span
            className="block min-w-0 truncate text-sm font-semibold text-foreground"
            title={formatted}
          >
            {formatted}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-emerald-600" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

const SectionHeader = ({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-2.5">
    <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
      {icon}
    </span>
    <span className="text-sm font-semibold tracking-tight text-foreground">
      {title}
    </span>
  </div>
);

export const ContactPanel = () => {
  const [openSections, setOpenSections] = useState<string[]>([
    "device",
    "location",
    "session",
  ]);
  const { toggleContactPanel } = useConversationLayoutControls();
  const params = useParams();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const contactSession = useQuery(
    api.private.contactSessions.getOneByConversationId,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip"
  );

  const metadata = contactSession?.metadata;

  const countryInfo = useMemo(() => {
    if (!metadata?.timezone) return null;
    return getCountryNameFromTimzezone(metadata.timezone);
  }, [metadata?.timezone]);

  const utcOffset = useMemo(
    () => formatUtcOffsetFromTimezone(metadata?.timezone),
    [metadata?.timezone]
  );

  const userAgentInfo = useMemo(() => {
    if (!metadata?.userAgent) return null;

    try {
      const result = Bowser.getParser(metadata.userAgent).getResult();

      return {
        browser: result.browser.name ?? null,
        browserVersion: result.browser.version ?? null,
        os: result.os.name ?? null,
        osVersion: result.os.version ?? null,
        platform: result.platform.type ?? null,
      };
    } catch {
      return null;
    }
  }, [metadata?.userAgent]);

  const browserLabel = userAgentInfo?.browser
    ? userAgentInfo.browserVersion
      ? `${userAgentInfo.browser} ${userAgentInfo.browserVersion}`
      : userAgentInfo.browser
    : null;

  const osLabel = userAgentInfo?.os
    ? userAgentInfo.osVersion
      ? `${userAgentInfo.os} ${userAgentInfo.osVersion}`
      : userAgentInfo.os
    : null;

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8 text-center text-muted-foreground">
        <InfoIcon className="mb-3 size-8 opacity-50" />
        <p className="text-sm font-medium">Invalid conversation ID.</p>
      </div>
    );
  }

  if (contactSession === undefined) {
    return <ContactPanelLoading />;
  }

  if (contactSession === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8 text-center text-muted-foreground">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Clock3Icon className="size-6 text-muted-foreground/55" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          No contact found
        </h3>
        <p className="mt-1 max-w-[220px] text-xs leading-5">
          This contact session may have expired or been removed.
        </p>
      </div>
    );
  }

  const name = contactSession.name || "Anonymous visitor";
  const email = contactSession.email;
  const countryFlagUrl = countryInfo?.code
    ? getCountryFlagUrl(countryInfo.code)
    : undefined;
  const allSectionsOpen = openSections.length === 3;

  return (
    <aside className="flex h-full w-full flex-col bg-background text-foreground">
      <div className="border-b border-border/60 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Visitor Context
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              Contact details
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {countryInfo?.name ? (
              <span className="rounded-full border border-border bg-muted/45 px-2 py-1 text-xs font-medium text-muted-foreground">
                {countryInfo.name}
              </span>
            ) : null}
            {/* Close panel button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleContactPanel}
              className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close contact panel"
              title="Close contact panel"
            >
              <PanelRightCloseIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DiceBearAvatar
            seed={contactSession._id}
            badgeImageUrl={countryFlagUrl}
            imageUrl=""
            size={54}
            className="ring-1 ring-border"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {name}
            </h3>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <MailIcon className="size-3.5 shrink-0" />
              <span className="truncate">{email}</span>
            </div>
          </div>
        </div>

        {email ? (
          <Button asChild className="mt-5 w-full gap-2" variant="outline">
            <NextLink href={`mailto:${email}`}>
              <SendIcon className="size-4" />
              Send email
            </NextLink>
          </Button>
        ) : (
          <Button className="mt-5 w-full gap-2" disabled variant="outline">
            <SendIcon className="size-4" />
            No email available
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Details
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setOpenSections(
                allSectionsOpen ? [] : ["device", "location", "session"]
              )
            }
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            {allSectionsOpen ? (
              <ChevronsDownUpIcon className="size-3.5" />
            ) : (
              <ChevronsUpDownIcon className="size-3.5" />
            )}
            {allSectionsOpen ? "Collapse all" : "Expand all"}
          </Button>
        </div>

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-3"
        >
          <AccordionItem
            value="device"
            className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-muted/45 hover:no-underline">
              <SectionHeader
                icon={<MonitorIcon className="size-4" />}
                title="Device"
              />
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50 bg-muted/15 px-1 py-2">
              <InfoRow
                label="Browser"
                value={browserLabel}
                icon={<AppWindowIcon className="size-4" />}
              />
              <InfoRow
                label="OS"
                value={osLabel}
                icon={<CpuIcon className="size-4" />}
              />
              <InfoRow
                label="Platform"
                value={userAgentInfo?.platform}
                icon={<SmartphoneIcon className="size-4" />}
                help="The device category detected from the visitor's browser user agent."
              />
              <InfoRow
                label="Cookies"
                value={
                  metadata?.cookieEnabled !== undefined
                    ? metadata.cookieEnabled
                      ? "Enabled"
                      : "Disabled"
                    : null
                }
                icon={<CookieIcon className="size-4" />}
                help="Whether the visitor's browser reported cookies as enabled. This can affect saved sessions."
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="location"
            className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-muted/45 hover:no-underline">
              <SectionHeader
                icon={<GlobeIcon className="size-4" />}
                title="Location"
              />
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50 bg-muted/15 px-1 py-2">
              <InfoRow
                label="Country"
                value={countryInfo?.name}
                icon={<MapPinIcon className="size-4" />}
              />
              <InfoRow
                label="Language"
                value={metadata?.language}
                icon={<LanguagesIcon className="size-4" />}
              />
              <InfoRow
                label="Timezone"
                value={metadata?.timezone}
                icon={<ClockIcon className="size-4" />}
                help="The timezone reported by the visitor's browser. It is useful for estimating local business hours."
              />
              <InfoRow
                label="UTC offset"
                value={utcOffset}
                icon={<GlobeIcon className="size-4" />}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="session"
            className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-muted/45 hover:no-underline">
              <SectionHeader
                icon={<Clock3Icon className="size-4" />}
                title="Session"
              />
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50 bg-muted/15 px-1 py-2">
              <InfoRow
                label="Started"
                value={formatDateTime(
                  contactSession.createdAt ?? contactSession._creationTime
                )}
                icon={<CalendarIcon className="size-4" />}
              />
              <InfoRow
                label="Expires"
                value={formatDateTime(contactSession.expiresAt)}
                icon={<TimerIcon className="size-4" />}
              />
              <InfoRow
                label="Source"
                value={metadata?.source}
                icon={<NavigationIcon className="size-4" />}
                isLink={!!metadata?.source}
              />
              <InfoRow
                label="Referrer"
                value={metadata?.referrer}
                isLink={!!metadata?.referrer}
                icon={<LinkIcon className="size-4" />}
                help="The page that sent the visitor to the site before the widget session started, when available."
              />
              <InfoRow
                label="Current URL"
                value={metadata?.currentUrl}
                isLink={!!metadata?.currentUrl}
                icon={<MousePointerClickIcon className="size-4" />}
                help="The page URL captured from the visitor's browser when the contact session was created."
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
};

const ContactPanelLoading = () => (
  <div className="flex h-full w-full flex-col bg-background">
    <div className="border-b border-border/60 p-5">
      <div className="mb-5 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="mt-5 h-9 w-full rounded-md" />
    </div>
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  </div>
);
