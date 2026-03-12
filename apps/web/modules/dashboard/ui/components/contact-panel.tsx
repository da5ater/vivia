"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import NextLink from "next/link";
import { useQuery } from "convex/react";
import {
    Clock3Icon,
    GlobeIcon,
    MailIcon,
    MonitorIcon,
    MousePointerClickIcon,
    AppWindowIcon,
    CpuIcon,
    MapPinIcon,
    LanguagesIcon,
    ClockIcon,
    CalendarIcon,
    LinkIcon,
    NavigationIcon,
    SmartphoneIcon,
    InfoIcon,
    CookieIcon,
    TimerIcon,
} from "lucide-react";
import Bowser from "bowser";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { api } from "@workspace/backend/convex/_generated/api";
import { Id } from "@workspace/backend/convex/_generated/dataModel";

import {
    getCountryFlagUrl,
    getCountryNameFromTimzezone,
} from "@/lib/country-utils";

type InfoRowProps = {
    label: string;
    value?: string | number | null;
    icon?: React.ReactNode;
    isLink?: boolean;
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
        const now = new Date();

        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            timeZoneName: "shortOffset",
        });

        const parts = formatter.formatToParts(now);
        const tzPart = parts.find((part) => part.type === "timeZoneName")?.value;

        if (!tzPart) return null;

        return tzPart.replace("GMT", "UTC");
    } catch {
        return null;
    }
};

const InfoRow = ({ label, value, icon, isLink }: InfoRowProps) => {
    const formatted = formatValue(value);
    if (!formatted) return null;

    return (
        <div className="group flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors duration-200">
            <div className="flex items-center gap-2.5 shrink-0">
                {icon && (
                    <div className="text-muted-foreground/70 group-hover:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {label}
                </span>
            </div>
            <div className="min-w-0 flex-1 flex justify-end">
                {isLink ? (
                    <a
                        href={formatted as string}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-primary hover:underline truncate"
                    >
                        {formatted}
                    </a>
                ) : (
                    <span
                        className="text-sm font-semibold text-foreground truncate"
                        title={formatted as string}
                    >
                        {formatted}
                    </span>
                )}
            </div>
        </div>
    );
};

const SectionHeader = ({
    icon,
    title,
}: {
    icon: React.ReactNode;
    title: string;
}) => {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                {icon}
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">
                {title}
            </span>
        </div>
    );
};

export const ContactPanel = () => {
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

    const utcOffset = useMemo(() => {
        return formatUtcOffsetFromTimezone(metadata?.timezone);
    }, [metadata?.timezone]);

    const userAgentInfo = useMemo(() => {
        const rawUserAgent = metadata?.userAgent;
        if (!rawUserAgent) return null;

        try {
            const parser = Bowser.getParser(rawUserAgent);
            const result = parser.getResult();

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

    const browserLabel = useMemo(() => {
        if (!userAgentInfo?.browser) return null;
        return userAgentInfo.browserVersion
            ? `${userAgentInfo.browser} ${userAgentInfo.browserVersion}`
            : userAgentInfo.browser;
    }, [userAgentInfo]);

    const osLabel = useMemo(() => {
        if (!userAgentInfo?.os) return null;
        return userAgentInfo.osVersion
            ? `${userAgentInfo.os} ${userAgentInfo.osVersion}`
            : userAgentInfo.os;
    }, [userAgentInfo]);

    if (!conversationId) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-background text-muted-foreground">
                <InfoIcon className="size-8 mb-3 opacity-50" />
                <p className="text-sm font-medium">Invalid conversation ID.</p>
            </div>
        );
    }

    if (contactSession === undefined) {
        return (
            <div className="flex flex-col h-full w-full bg-background/50 animate-pulse">
                <div className="border-b border-border/70 p-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="size-14 rounded-full" />
                        <div className="flex-1 space-y-2 py-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <Skeleton className="mt-6 h-10 w-full rounded-md" />
                </div>
                <div className="p-4 space-y-4">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (contactSession === null) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-background text-muted-foreground">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
                    <Clock3Icon className="size-6 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                    No contact found
                </h3>
                <p className="text-xs mt-1 max-w-[200px]">
                    This contact session might have been deleted or never existed.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <div className="relative border-b border-border/50 bg-muted/10 p-5 overflow-hidden">
                {/* Subtle background glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col gap-5">
                    <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-sm" />
                            <DiceBearAvatar
                                seed={contactSession._id}
                                badgeImageUrl={
                                    countryInfo?.code
                                        ? getCountryFlagUrl(countryInfo.code)
                                        : undefined
                                }
                                imageUrl=""
                                size={52}
                                className="relative ring-2 ring-background ring-offset-1 ring-offset-background/50"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-base font-semibold text-foreground tracking-tight mb-0.5">
                                {contactSession.name}
                            </h4>

                            <div className="flex items-center gap-1.5 min-w-0">
                                <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
                                <p className="truncate text-sm text-muted-foreground">
                                    {contactSession.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        asChild
                        className="group w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <NextLink href={`mailto:${contactSession.email}`}>
                            <MailIcon className="mr-2 size-4 transition-transform group-hover:scale-110" />
                            <span className="font-semibold">Send Email</span>
                        </NextLink>
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <Accordion
                    type="multiple"
                    defaultValue={["device", "location", "session"]}
                    className="w-full space-y-4"
                >
                    <AccordionItem
                        value="device"
                        className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden"
                    >
                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 py-3 transition-colors outline-none !border-b-0 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
                            <SectionHeader
                                icon={<MonitorIcon className="size-4" />}
                                title="Device Information"
                            />
                        </AccordionTrigger>

                        <AccordionContent className="px-2 pt-2 pb-2 bg-muted/10">
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
                            />
                            <InfoRow
                                label="Cookies Enabled"
                                value={metadata?.cookieEnabled !== undefined ? (metadata.cookieEnabled ? "Yes" : "No") : null}
                                icon={<CookieIcon className="size-4" />}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                        value="location"
                        className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden"
                    >
                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 py-3 transition-colors outline-none !border-b-0 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
                            <SectionHeader
                                icon={<GlobeIcon className="size-4" />}
                                title="Location & Language"
                            />
                        </AccordionTrigger>

                        <AccordionContent className="px-2 pt-2 pb-2 bg-muted/10">
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
                            />
                            <InfoRow
                                label="UTC Offset"
                                value={utcOffset}
                                icon={<GlobeIcon className="size-4" />}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem
                        value="session"
                        className="border border-border/40 rounded-xl bg-card shadow-sm overflow-hidden"
                    >
                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 py-3 transition-colors outline-none !border-b-0 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
                            <SectionHeader
                                icon={<Clock3Icon className="size-4" />}
                                title="Session Details"
                            />
                        </AccordionTrigger>

                        <AccordionContent className="px-2 pt-2 pb-2 bg-muted/10">
                            <InfoRow
                                label="Started"
                                value={formatDateTime(contactSession.createdAt ?? contactSession._creationTime)}
                                icon={<CalendarIcon className="size-4" />}
                            />
                            <InfoRow
                                label="Expires At"
                                value={formatDateTime(contactSession.expiresAt)}
                                icon={<TimerIcon className="size-4" />}
                            />
                            <InfoRow
                                label="Source"
                                value={metadata?.source}
                                icon={<NavigationIcon className="size-4" />}
                            />
                            <InfoRow
                                label="Referrer"
                                value={metadata?.referrer}
                                isLink={!!metadata?.referrer}
                                icon={<LinkIcon className="size-4" />}
                            />
                            <InfoRow
                                label="Current URL"
                                value={metadata?.currentUrl}
                                isLink={!!metadata?.currentUrl}
                                icon={<MousePointerClickIcon className="size-4" />}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
};
