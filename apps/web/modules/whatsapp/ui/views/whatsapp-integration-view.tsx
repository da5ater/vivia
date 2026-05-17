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
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { InfoPopover } from "@/components/info-popover";

function getWebhookUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_CONVEX_HTTP_URL;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (explicitUrl) {
    return `${explicitUrl.replace(/\/$/, "")}/whatsapp`;
  }

  if (convexUrl) {
    return `${convexUrl.replace(".cloud", ".site").replace(/\/$/, "")}/whatsapp`;
  }

  return "";
}

export const WhatsAppIntegrationView = () => {
  const config = useQuery(api.private.whatsapp.getOne);
  const saveConfig = useAction(api.private.whatsapp.upsert);
  const setEnabled = useMutation(api.private.whatsapp.setEnabled);

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const webhookUrl = useMemo(() => getWebhookUrl(), []);
  const isConnected = Boolean(config?.phoneNumberId && config?.isEnabled);
  const cleanBusinessPhoneNumber = businessPhoneNumber.replace(/\D/g, "");
  const whatsappLink = cleanBusinessPhoneNumber
    ? `https://wa.me/${cleanBusinessPhoneNumber}`
    : "";

  useEffect(() => {
    if (!config) return;
    setPhoneNumberId(config.phoneNumberId);
    setBusinessPhoneNumber(config.businessPhoneNumber ?? "");
    setIsEnabled(config.isEnabled);
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
    const trimmedPhoneNumberId = phoneNumberId.trim();
    const trimmedAccessToken = accessToken.trim();

    if (!trimmedPhoneNumberId) {
      toast.error("Phone Number ID is required");
      return;
    }

    if (!config && !trimmedAccessToken) {
      toast.error("Access token is required");
      return;
    }

    setIsSaving(true);

    try {
      await saveConfig({
        phoneNumberId: trimmedPhoneNumberId,
        businessPhoneNumber,
        accessToken: trimmedAccessToken || undefined,
        isEnabled,
      });
      setAccessToken("");
      toast.success("WhatsApp integration saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save WhatsApp settings";
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
      toast.success(checked ? "WhatsApp enabled" : "WhatsApp disabled");
    } catch (error) {
      setIsEnabled(!checked);
      const message =
        error instanceof Error ? error.message : "Could not update WhatsApp status";
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="WhatsApp Integration"
          title="Connect WhatsApp"
          description="Let customers message your WhatsApp number and receive answers from this workspace's Vivia knowledge base."
          icon={MessageCircle}
        />

        <Badge
          variant={isConnected ? "default" : "outline"}
          className={cn(
            "h-9 gap-2 px-4 text-sm",
            isConnected && "bg-emerald-600 text-white hover:bg-emerald-600"
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              isConnected ? "bg-white" : "bg-muted-foreground"
            )}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="size-5 text-primary" />
              <CardTitle>Meta Cloud API settings</CardTitle>
            </div>
            <CardDescription>
              Use the free direct Meta Cloud API path. No Twilio or paid third-party gateway is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="phoneNumberId" className="flex items-center gap-1.5">
                Phone Number ID
                <InfoPopover title="Phone Number ID">
                  The Meta WhatsApp Cloud API identifier for the business phone
                  number that should receive messages.
                </InfoPopover>
              </Label>
              <Input
                id="phoneNumberId"
                placeholder="Example: 123456789012345"
                value={phoneNumberId}
                onChange={(event) => setPhoneNumberId(event.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="businessPhoneNumber">Business WhatsApp number</Label>
              <Input
                id="businessPhoneNumber"
                placeholder="Optional. Vivia can fetch it from Meta."
                value={businessPhoneNumber}
                onChange={(event) => setBusinessPhoneNumber(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Leave blank to fetch it from the Phone Number ID, or enter it manually to override the share link.
              </p>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="accessToken" className="flex items-center gap-1.5">
                Access token
                <InfoPopover title="Access token">
                  The Meta token used to send and receive WhatsApp messages.
                  It is saved securely and only needs to be replaced when it
                  expires or changes.
                </InfoPopover>
              </Label>
              <Input
                id="accessToken"
                type="password"
                placeholder={config ? "Saved securely. Enter a new token to replace it." : "Paste your Meta access token"}
                value={accessToken}
                onChange={(event) => setAccessToken(event.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/70 px-4 py-3">
              <div className="space-y-1">
                <Label htmlFor="enabled">Enable WhatsApp replies</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, incoming WhatsApp messages trigger the support AI.
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
              className="h-11 w-full gap-2"
              disabled={isSaving || !phoneNumberId.trim() || (!config && !accessToken.trim())}
              onClick={handleSave}
            >
              <ShieldCheck className="size-4" />
              {isSaving ? "Saving..." : "Save WhatsApp settings"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Link2 className="size-5 text-primary" />
                <CardTitle>Webhook setup</CardTitle>
              </div>
              <CardDescription>
                Paste these values into the WhatsApp webhook section in your Meta app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  Callback URL
                  <InfoPopover title="Callback URL">
                    Paste this URL into the webhook settings in your Meta app
                    so WhatsApp can deliver incoming messages to Vivia.
                  </InfoPopover>
                </Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookUrl} className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(webhookUrl, "Webhook URL")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  Verify token
                  <InfoPopover title="Verify token">
                    Meta uses this token once to confirm that the callback URL
                    belongs to your Vivia workspace.
                  </InfoPopover>
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={config?.verifyToken ?? "Save settings to generate a token"}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!config?.verifyToken}
                    onClick={() => handleCopy(config?.verifyToken ?? "", "Verify token")}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ExternalLink className="size-5 text-primary" />
                <CardTitle>Customer share link</CardTitle>
              </div>
              <CardDescription>
                Publish this link on your website, social pages, ads, or QR code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={whatsappLink || "Add your business WhatsApp number to generate a link"}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!whatsappLink}
                  onClick={() => handleCopy(whatsappLink, "WhatsApp share link")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              {whatsappLink ? (
                <Button asChild variant="outline" className="w-full gap-2">
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open customer link
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                <CardTitle>Free-first setup</CardTitle>
              </div>
              <CardDescription>
                Keep this for customer-initiated support replies. Broadcasts and templates may create Meta charges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {[
                "Create a Meta WhatsApp Cloud API app.",
                "Use the test number or your approved business number.",
                "Add the callback URL and verify token above.",
                "Send a WhatsApp message and Vivia will answer from this org's knowledge base.",
              ].map((step) => (
                <div key={step} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
