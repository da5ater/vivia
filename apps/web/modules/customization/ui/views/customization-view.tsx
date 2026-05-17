"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { InfoIcon, Loader2Icon, PaletteIcon, SparklesIcon } from "lucide-react";

import { api } from "@workspace/backend/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { PageHeader } from "@/components/page-header";
import { CustomizationForm } from "../components/customization-form";

export const CustomizationView = () => {
  const widgetSettings = useQuery(api.private.widgetSettings.getOne);
  const vapiPlugin = useQuery(api.private.plugins.getOne, { service: "vapi" });

  const isLoading = widgetSettings === undefined || vapiPlugin === undefined;
  const hasVapiPlugin = useMemo(() => vapiPlugin !== null, [vapiPlugin]);

  if (isLoading) {
    return (
      <div className="w-full py-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-3 py-24">
          <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          <div className="space-y-1 text-center">
            <p className="text-sm font-medium">Loading settings...</p>
            <p className="text-xs text-muted-foreground">
              Fetching your widget configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!widgetSettings) {
    return (
      <div className="w-full space-y-8 py-2">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <PageHeader
            eyebrow="Widget Settings"
            title="Widget customization"
            description="Control the greeting, suggested questions, and voice options visitors see in the widget."
            icon={PaletteIcon}
          />

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-muted-foreground" />
                No settings yet
              </CardTitle>
              <CardDescription>
                No widget record was found. Create one first, then refresh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up your widget URL and greeting before editing the full
                customization options.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 py-2">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <PageHeader
          eyebrow="Widget Settings"
          title="Widget customization"
          description="Control the greeting, suggested questions, and voice options visitors see in the widget."
          icon={PaletteIcon}
        />

        {!hasVapiPlugin && (
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
            <InfoIcon className="h-4 w-4 shrink-0" />
            <span>
              Voice calling is not enabled.{" "}
              <span className="font-medium text-foreground">
                Connect Vapi
              </span>{" "}
              to unlock voice settings.
            </span>
          </div>
        )}

        <CustomizationForm
          initialData={widgetSettings ?? null}
          hasVapiPlugin={hasVapiPlugin}
        />
      </div>
    </div>
  );
};
