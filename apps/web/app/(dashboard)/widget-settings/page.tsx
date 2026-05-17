"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  ExternalLinkIcon,
  Globe2Icon,
  LinkIcon,
  PencilIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@workspace/backend/convex/_generated/api";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { InfoPopover } from "@/components/info-popover";
import { PageHeader } from "@/components/page-header";

const WIDGET_BASE_URL =
  process.env.NEXT_PUBLIC_WIDGET_URL ?? "https://vivia-widget.vercel.app";

const normalizeSlug = (value: string) =>
  value.toLowerCase().replace(/^vivia-/, "").replace(/[^a-z0-9-]/g, "");

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  return fallback;
};

const SetupStep = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2">
    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
    <p>{children}</p>
  </div>
);

const WidgetSettingsView = () => {
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
  const widgetUrl = slug ? `${WIDGET_BASE_URL}/${slug}` : null;
  const previewSlug = slugDraft || "acme-support";

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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update slug"));
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update widget status"));
    } finally {
      setToggleLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!widgetUrl) return;

    await navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (user === undefined || settings === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl border border-border/40 bg-muted"
          />
        ))}
      </div>
    );
  }

  if (settings === null) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
        <PageHeader
          eyebrow="Widget Setup"
          title="Set up your support widget"
          description="Choose the public URL visitors will use before enabling and sharing the widget."
          icon={SparklesIcon}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="size-4 text-muted-foreground" />
                Public URL slug
                <InfoPopover title="Public URL slug">
                  This becomes the last part of your widget link. Use something
                  short, memorable, and safe to share with customers.
                </InfoPopover>
              </CardTitle>
              <CardDescription>
                Lowercase letters, numbers, and hyphens only. The app cleans
                invalid characters as you type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={slugDraft}
                  onChange={(event) =>
                    setSlugDraft(normalizeSlug(event.target.value))
                  }
                  placeholder="acme-support"
                  className="h-10 flex-1 font-mono text-sm"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSlugSave();
                  }}
                />
                <Button
                  onClick={handleSlugSave}
                  disabled={slugLoading || !slugDraft.trim()}
                  className="shrink-0 gap-2"
                >
                  <ShieldCheckIcon className="size-4" />
                  {slugLoading ? "Creating..." : "Create widget"}
                </Button>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/35 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Preview
                </p>
                <code className="mt-1 block break-all text-xs text-foreground">
                  {`${WIDGET_BASE_URL}/${previewSlug}`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/25 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe2Icon className="size-4 text-muted-foreground" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <SetupStep>Your public widget link is generated.</SetupStep>
              <SetupStep>You can enable the widget and copy the URL.</SetupStep>
              <SetupStep>
                Customize greeting and quick suggestions after setup.
              </SetupStep>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <PageHeader
        eyebrow="Widget Settings"
        title="Widget settings"
        description="Manage your public widget URL, availability, and shareable support link."
        icon={CodeIcon}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Widget status
            <InfoPopover title="Widget status">
              When active, visitors can open the widget from the public URL.
              Disable it when you want to pause new widget sessions.
            </InfoPopover>
          </CardTitle>
          <CardDescription>
            Enable or disable your widget for visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            <span className="text-sm font-medium">
              {isActive ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
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
              <ToggleRightIcon className="size-4 text-emerald-600" />
            ) : (
              <ToggleLeftIcon className="size-4" />
            )}
            {isActive ? "Disable" : "Enable"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-base">
            Widget URL slug
            <InfoPopover title="Widget URL slug">
              The slug is the public path visitors use to open your widget.
              Only lowercase letters, numbers, and hyphens are allowed.
            </InfoPopover>
          </CardTitle>
          <CardDescription>
            Your widget is accessible at a unique URL using this slug.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {slugEditing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={slugDraft}
                onChange={(event) =>
                  setSlugDraft(normalizeSlug(event.target.value))
                }
                placeholder="your-slug"
                className="flex-1 font-mono text-sm"
                autoFocus
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSlugSave();
                  if (event.key === "Escape") handleSlugCancel();
                }}
              />
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSlugSave}
                  disabled={slugLoading || !slugDraft.trim()}
                >
                  {slugLoading ? "Saving..." : "Save"}
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
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
                {slug ?? (
                  <span className="italic text-muted-foreground">not set</span>
                )}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSlugEdit}
                className="shrink-0 gap-1.5"
              >
                <PencilIcon className="size-3.5" />
                {slug ? "Edit" : "Set slug"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {widgetUrl ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CodeIcon className="size-4" />
              Widget URL
              <InfoPopover title="Widget URL">
                Share this URL with teammates or use it to test the standalone
                widget before embedding it.
              </InfoPopover>
              <Button asChild size="icon-sm" variant="ghost" className="ml-auto">
                <a
                  href={widgetUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open widget URL"
                >
                  <ExternalLinkIcon className="size-4" />
                </a>
              </Button>
            </CardTitle>
            <CardDescription>
              Share or embed this URL to load your support widget.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
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
                  <CheckIcon className="size-4 text-emerald-600" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
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

const Page = () => {
  return <WidgetSettingsView />;
};

export default Page;
