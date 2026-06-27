"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  MessageSquare,
  Facebook,
  ShieldCheck,
  Globe,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { InfoPopover } from "@/components/info-popover";

function getWebhookUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (explicitUrl) {
    return `${explicitUrl.replace(/\/$/, "")}/messenger`;
  }

  if (convexUrl) {
    return `${convexUrl.replace(".cloud", ".site").replace(/\/$/, "")}/messenger`;
  }

  return "";
}

const PENDING_PAGE_ID = "__pending_messenger_page__";

export const MessengerIntegrationView = () => {
  const config = useQuery(api.private.messenger.getOne);
  const saveConfig = useAction(api.private.messenger.upsert);
  const setEnabled = useMutation(api.private.messenger.setEnabled);

  const [accessToken, setAccessToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [pageName, setPageName] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const webhookUrl = useMemo(() => getWebhookUrl(), []);
  
  const savedPageId =
    config?.pageId && config.pageId !== PENDING_PAGE_ID ? config.pageId : "";
  const configPageName = config?.pageName ?? "";
  const hasConnectedPage = Boolean(savedPageId);
  const isConnected = Boolean(hasConnectedPage && config?.isEnabled);
  
  const messengerLink = savedPageId
    ? `https://m.me/${savedPageId}`
    : "";

  useEffect(() => {
    if (!config) return;
    setIsEnabled(config.isEnabled);
    if (config.pageId && config.pageId !== PENDING_PAGE_ID) {
      setPageId(config.pageId);
    }
    if (config.pageName) {
      setPageName(config.pageName);
    }
  }, [config]);

  const handleCopy = async (value: string, label: string) => {
    if (!value) {
      toast.error(`${label} is not available yet`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const handleSave = async () => {
    const trimmedAccessToken = accessToken.trim();
    const trimmedPageId = pageId.trim();
    const trimmedPageName = pageName.trim();

    if (!hasConnectedPage && !trimmedAccessToken) {
      toast.error("Page Access Token is required");
      return;
    }

    setIsSaving(true);

    try {
      await saveConfig({
        accessToken: trimmedAccessToken || undefined,
        pageId: trimmedPageId || undefined,
        pageName: trimmedPageName || undefined,
        isEnabled,
      });
      setAccessToken("");
      toast.success("Messenger integration saved successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save Messenger settings";
      toast.error(message, {
        duration: 8000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSetup = async () => {
    setIsSaving(true);

    try {
      await saveConfig({
        accessToken: undefined,
        isEnabled,
      });
      toast.success("Messenger setup values generated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not generate Messenger setup";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!config) {
      setIsEnabled(checked);
      return;
    }

    setIsToggling(true);
    setIsEnabled(checked);

    try {
      await setEnabled({ isEnabled: checked });
      toast.success(checked ? "Messenger enabled" : "Messenger disabled");
    } catch (error) {
      setIsEnabled(!checked);
      const message =
        error instanceof Error ? error.message : "Could not update Messenger status";
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Messenger Integration"
          title="Connect Facebook Messenger"
          description="Let customers message your Facebook Page and receive answers from this workspace's Vivia knowledge base."
          icon={MessageSquare}
        />

        <Badge
          variant={isConnected ? "default" : "outline"}
          className={cn(
            "h-9 gap-2 px-4 text-sm font-semibold transition-all duration-200",
            isConnected && "bg-emerald-600 text-white hover:bg-emerald-600 border-transparent shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              isConnected ? "bg-white animate-pulse" : "bg-muted-foreground"
            )}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left Column: Webhook Setup & Connection Steps */}
        <div className="space-y-6">
          <Card className="border-border/75 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link2 className="size-5 text-primary" />
                <CardTitle>Webhook Endpoints</CardTitle>
              </div>
              <CardDescription>
                Provide these configuration details to your Meta Developer Dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Callback URL
                </Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookUrl} className="font-mono text-xs bg-background/80" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopy(webhookUrl, "Callback URL")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verify Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={config?.verifyToken ?? "Setup values not generated"}
                    className="font-mono text-xs bg-background/80"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    disabled={!config?.verifyToken}
                    onClick={() => handleCopy(config?.verifyToken ?? "", "Verify token")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                {!config?.verifyToken && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 mt-2"
                    disabled={isSaving}
                    onClick={handleGenerateSetup}
                  >
                    <Globe className="size-4 text-primary animate-pulse" />
                    Generate Setup Credentials
                  </Button>
                )}
              </div>

              {config?.verifyToken && (
                <div className="flex gap-3 items-start rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-blue-900 dark:text-blue-200 mt-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">Webhook Subscription Required</p>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Important: Once verified, you <strong>must</strong> subscribe to the <strong>messages</strong> event in Meta's Webhooks configuration, or Vivia will not receive your page's messages.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/75 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                <CardTitle>Connection Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              {[
                "Click 'Generate Setup Credentials' above to create a Verify Token.",
                "In Meta App Dashboard > Messenger > Settings, configure Webhooks.",
                "Paste the Callback URL and Verify Token, then click Verify & Save.",
                "Under Webhooks, subscribe to the 'messages' field.",
                "Generate a Page Access Token for your Facebook Page.",
                "Paste the Page Access Token here and click 'Verify & Save Connection'.",
                "Note: If auto-connection fails due to App permissions, expand 'Advanced Manual Setup' to manually paste your Page ID."
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Meta Page Setup & Chat Link */}
        <div className="space-y-6">
          <Card className="border-border/75 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Facebook className="size-5 text-blue-600" />
                <CardTitle>Meta Page Setup</CardTitle>
              </div>
              <CardDescription>
                Connect your Facebook Page by securely storing its access token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasConnectedPage && (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Active Integration</p>
                    <p className="text-xs text-muted-foreground">
                      Connected to Page: <span className="font-bold text-foreground">{configPageName || pageName}</span> (ID: {savedPageId})
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="accessToken" className="flex items-center gap-1.5 font-medium">
                  Page Access Token
                  <InfoPopover title="Page Access Token">
                    The Page Access Token generated in your Meta Developer Dashboard.
                    Vivia automatically identifies the Page ID and Page Name from this token.
                  </InfoPopover>
                </Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder={config ? "••••••••••••••••••••••••••••••••" : "Paste your Page Access Token"}
                  value={accessToken}
                  onChange={(event) => setAccessToken(event.target.value)}
                  className="bg-background/80"
                />
                {config && (
                  <p className="text-xs text-muted-foreground">
                    Saved securely. Enter a new token only to replace the existing connection.
                </p>
              )}
              </div>

              {/* Collapsible Advanced Manual Setup */}
              <div className="border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  Advanced Manual Setup (Fallback)
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If auto-fetching Page details fails due to Meta App Review permission restrictions (e.g. <i>pages_read_engagement</i>), manually enter your Page ID and Page Name below.
                    </p>
                    <div className="grid gap-3">
                      <Label htmlFor="manualPageId">Page ID</Label>
                      <Input
                        id="manualPageId"
                        placeholder="e.g. 104230491024"
                        value={pageId}
                        onChange={(event) => setPageId(event.target.value)}
                        className="bg-background/80"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="manualPageName">Page Name</Label>
                      <Input
                        id="manualPageName"
                        placeholder="e.g. Vivia Support"
                        value={pageName}
                        onChange={(event) => setPageName(event.target.value)}
                        className="bg-background/80"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/30 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled" className="text-sm font-medium">Enable Messenger channel</Label>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    When enabled, Vivia AI will respond to incoming Messenger messages.
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={isEnabled}
                  disabled={isToggling}
                  onCheckedChange={handleToggle}
                />
              </div>

              <Button
                className="h-11 w-full gap-2 font-medium"
                disabled={isSaving || (!hasConnectedPage && !accessToken.trim())}
                onClick={handleSave}
              >
                <ShieldCheck className="size-4" />
                {isSaving ? "Connecting..." : "Verify & Save Connection"}
              </Button>
            </CardContent>
          </Card>

          {messengerLink && (
            <Card className="border-border/75 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-5 text-primary" />
                  <CardTitle>Customer Contact Link</CardTitle>
                </div>
                <CardDescription>
                  Share this link with your users or link it on your landing pages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={messengerLink}
                    className="font-mono text-xs bg-background/80"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopy(messengerLink, "Messenger Link")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href={messengerLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open Chat
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
