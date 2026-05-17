"use client";

import { useAtomValue } from "jotai";
import { AlertTriangle } from "lucide-react";
import { errorMessageAtom, widgetSettingsAtom } from "../../atoms/widget-atoms";
import { WidgetHeader } from "../components/widget-header";
import { formatViviaOrganizationName } from "../../lib/branding";

export const WidgetErrorScreen = () => {
  const errorMessage = useAtomValue(errorMessageAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-1 py-3 font-semibold">
          <p className="text-xl leading-tight">{formatViviaOrganizationName(widgetSettings?.organizationName)}</p>
          <p className="text-sm font-normal leading-5 opacity-90">
            Something needs a quick refresh.
          </p>
        </div>
      </WidgetHeader>

      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        <AlertTriangle className="h-8 w-8" />
        {/* 2. Render the specific error, or a default fallback */}
        <p className="text-center text-sm">
          {errorMessage || "We could not load this widget right now. Please try again shortly."}
        </p>
      </div>
    </div>
  );
};
