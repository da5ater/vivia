"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import {
    CodeIcon,
    ToggleLeftIcon,
    ToggleRightIcon,
    CopyIcon,
    CheckIcon,
    PencilIcon,
    XIcon,
} from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@workspace/ui/components/card";

// ─── Main View ────────────────────────────────────────────────────────────────

const WidgetSettingsView = () => {
    // slug lives on the user record, not widgetSettings
    const user = useQuery(api.users.getMyUser);
    const settings = useQuery(api.private.widgetSettings.getOne);

    const updateSlug = useMutation(api.private.widgetSettings.updateSlug);
    const updateIsActive = useMutation(api.private.widgetSettings.updateIsActive);

    const [slugDraft, setSlugDraft] = useState("");
    const [slugEditing, setSlugEditing] = useState(false);
    const [slugLoading, setSlugLoading] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const slug = user?.slug ?? null;
    const isActive = settings?.isActive ?? false;

    const widgetUrl = slug
        ? `${process.env.NEXT_PUBLIC_WIDGET_URL ?? "https://vivia-widget.vercel.app"}/${slug}`
        : null;

    const slugInputValue = (value: string) =>
        value.toLowerCase().replace(/^vivia-/, "").replace(/[^a-z0-9-]/g, "");

    const handleSlugEdit = () => {
        setSlugDraft(slug ? slug.replace(/^vivia-/, "") : "");
        setSlugEditing(true);
    };

    const handleSlugCancel = () => {
        setSlugEditing(false);
        setSlugDraft("");
    };

    const handleSlugSave = async () => {
        if (!slugDraft.trim()) return;
        setSlugLoading(true);
        try {
            await updateSlug({ slug: slugDraft });
            setSlugEditing(false);
            toast.success("Slug updated successfully");
        } catch (e: any) {
            toast.error(e?.data?.message ?? "Failed to update slug");
        } finally {
            setSlugLoading(false);
        }
    };

    const handleToggleActive = async () => {
        if (settings == null) return;
        setToggleLoading(true);
        try {
            await updateIsActive({ isActive: !settings.isActive });
            toast.success(!settings.isActive ? "Widget enabled" : "Widget disabled");
        } catch (e: any) {
            toast.error(e?.data?.message ?? "Failed to update widget status");
        } finally {
            setToggleLoading(false);
        }
    };

    const handleCopy = () => {
        if (!widgetUrl) return;
        navigator.clipboard.writeText(widgetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Loading: undefined means still fetching ────────────────────────────────
    if (user === undefined || settings === undefined) {
        return (
            <div className="max-w-2xl mx-auto py-10 px-4 flex flex-col gap-6">
                <div>
                    <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-72 bg-muted animate-pulse rounded-md mt-2" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-32 bg-muted animate-pulse rounded-xl border border-border/40"
                    />
                ))}
            </div>
        );
    }

    // ── null means record doesn't exist yet ───────────────────────────────────
    if (settings === null) {
        return (
            <div className="max-w-2xl mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                    <ToggleLeftIcon className="size-6 text-muted-foreground" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Widget Not Initialized</h1>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
                        Please set your widget URL slug below to get started.
                    </p>
                </div>
                <div className="w-full max-w-sm mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Initial Setup</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex gap-2 items-center">
                                <Input
                                    value={slugDraft}
                                    onChange={(e) =>
                                        setSlugDraft(slugInputValue(e.target.value))
                                    }
                                    placeholder="your-slug"
                                    className="font-mono text-sm flex-1"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSlugSave}
                                    disabled={slugLoading || !slugDraft.trim()}
                                >
                                    {slugLoading ? "Creating…" : "Initialize"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // ── Main UI ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto py-10 px-4 flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Widget Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your embeddable support widget's URL and availability.
                </p>
            </div>

            {/* ── Status card ─────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Widget Status</CardTitle>
                    <CardDescription>
                        Enable or disable your widget for visitors.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span
                            className={
                                isActive
                                    ? "size-2 rounded-full bg-green-500 inline-block"
                                    : "size-2 rounded-full bg-muted-foreground/40 inline-block"
                            }
                        />
                        <span className="text-sm font-medium">
                            {isActive ? (
                                <span className="text-green-600">Active</span>
                            ) : (
                                <span className="text-muted-foreground">Inactive</span>
                            )}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleActive}
                        disabled={toggleLoading}
                        className="gap-2"
                    >
                        {isActive ? (
                            <ToggleRightIcon className="size-4 text-green-600" />
                        ) : (
                            <ToggleLeftIcon className="size-4" />
                        )}
                        {isActive ? "Disable" : "Enable"}
                    </Button>
                </CardContent>
            </Card>

            {/* ── Slug card ────────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Widget URL Slug</CardTitle>
                    <CardDescription>
                        Your widget is accessible at a unique URL using this slug.
                        Only lowercase letters, numbers, and hyphens are allowed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {slugEditing ? (
                        <div className="flex gap-2 items-center">
                            <Input
                                value={slugDraft}
                                onChange={(e) =>
                                    setSlugDraft(slugInputValue(e.target.value))
                                }
                                placeholder="your-slug"
                                className="font-mono text-sm flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSlugSave();
                                    if (e.key === "Escape") handleSlugCancel();
                                }}
                            />
                            <Button
                                size="sm"
                                onClick={handleSlugSave}
                                disabled={slugLoading || !slugDraft.trim()}
                            >
                                {slugLoading ? "Saving…" : "Save"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSlugCancel}
                                disabled={slugLoading}
                            >
                                <XIcon className="size-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <code className="text-sm bg-muted px-3 py-1.5 rounded-md font-mono flex-1 min-w-0 truncate">
                                {slug ?? (
                                    <span className="text-muted-foreground italic">not set</span>
                                )}
                            </code>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSlugEdit}
                                className="gap-1.5 shrink-0"
                            >
                                <PencilIcon className="size-3.5" />
                                {slug ? "Edit" : "Set slug"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Widget URL card ───────────────────────────────────────────────── */}
            {widgetUrl ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CodeIcon className="size-4" />
                            Widget URL
                        </CardTitle>
                        <CardDescription>
                            Share or embed this URL to load your support widget.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-3 py-2 rounded-md font-mono flex-1 break-all">
                                {widgetUrl}
                            </code>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCopy}
                                className="shrink-0"
                                aria-label="Copy widget URL"
                            >
                                {copied ? (
                                    <CheckIcon className="size-4 text-green-600" />
                                ) : (
                                    <CopyIcon className="size-4" />
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="py-8 flex flex-col items-center gap-2 text-center">
                        <CodeIcon className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            Set a slug above to generate your widget URL.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Page = () => {
    return <WidgetSettingsView />;
};

export default Page;
