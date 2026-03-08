"use client";

import { ArrowLeftIcon, PhoneIcon, CopyIcon, CheckIcon, PhoneCallIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useAtomValue, useSetAtom } from "jotai";
import { widgetScreenAtom, widgetSettingsAtom } from "../../atoms/widget-atoms";
import { WidgetHeader } from "../components/widget-header";
import { WidgetFooter } from "../components/widget-footer";
import { useState } from "react";
import { cn } from "@workspace/ui/lib/utils";

// UUID regex to detect if the old Vapi internal ID is accidentally saved instead of a real number
const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ── Main screen ──────────────────────────────────────────────────────────────
export const WidgetContactScreen = () => {
  const setScreen = useSetAtom(widgetScreenAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const rawPhoneNumber = widgetSettings?.vapiSettings?.phoneNumber ?? "";
  
  // If the saved phone number is a UUID (internal Vapi ID), we ignore it forcing them to re-save
  const hasValidPhone = rawPhoneNumber && !isUUID(rawPhoneNumber);
  const phoneNumber = hasValidPhone ? rawPhoneNumber : "";

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!phoneNumber) return;
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — silently ignore
    }
  };

  return (
    <>
      <WidgetHeader className="flex items-center gap-3 py-3">
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
          onClick={() => setScreen("selection")}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        <div className="flex flex-col leading-tight">
          <p className="text-sm font-semibold text-primary-foreground">Call Us</p>
          <p className="text-xs text-primary-foreground/70">Reach our team by phone</p>
        </div>
      </WidgetHeader>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8">
        {/* Phone icon badge */}
        <div className="relative flex items-center justify-center">
          <span className="absolute size-20 rounded-full bg-primary/8 animate-ping [animation-duration:2s]" />
          <span className="absolute size-16 rounded-full bg-primary/10" />
          <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
            <PhoneIcon className="size-7 text-primary" />
          </div>
        </div>

        {/* Instructional copy */}
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold">Give us a call</p>
          <p className="text-xs text-muted-foreground">
            Our team is available to help. Tap the number below to dial or copy
            it to your clipboard.
          </p>
        </div>

        {/* Phone number card */}
        {phoneNumber ? (
          <div className="w-full rounded-2xl border border-border bg-muted/50 p-4 shadow-sm">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Phone Number
            </p>

            <div className="flex items-center justify-between gap-3">
              {/* Tap-to-call link */}
              <a
                href={`tel:${phoneNumber}`}
                className="flex items-center gap-2 text-base font-semibold tabular-nums text-foreground transition-colors hover:text-primary"
              >
                <PhoneCallIcon className="size-4 shrink-0 text-primary" />
                {phoneNumber}
              </a>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200",
                  copied
                    ? "border-green-500/30 bg-green-500/10 text-green-600"
                    : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                )}
              >
                {copied ? (
                  <>
                    <CheckIcon className="size-3 shrink-0" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-3 shrink-0" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            {!hasValidPhone && rawPhoneNumber ? (
              <span>Your phone number needs to be re-saved in the Dashboard.</span>
            ) : (
              <span>No phone number configured.</span>
            )}
          </div>
        )}

        {/* Primary CTA */}
        {phoneNumber && (
          <a href={`tel:${phoneNumber}`} className="w-full">
            <Button className="w-full" size="lg">
              <PhoneCallIcon className="size-5" />
              <span>Call Now</span>
            </Button>
          </a>
        )}
      </div>

      <WidgetFooter />
    </>
  );
};