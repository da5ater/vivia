"use client";

import { useAtomValue } from "jotai";
import { AlertTriangle } from "lucide-react";
import { errorMessageAtom } from "../../atoms/widget-atoms";
import { WidgetHeader } from "../components/widget-header";

export const WidgetErrorScreen = () => {
  const errorMessage = useAtomValue(errorMessageAtom);

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6 font-semibold">
          <p className="text-3xl">we are here to help you</p>
          <p className="text-lg">lets get started</p>
        </div>
      </WidgetHeader>

      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-4 text-muted-foreground">
        <AlertTriangle className="h-8 w-8" />
        {/* 2. Render the specific error, or a default fallback */}
        <p className="text-sm">{errorMessage || "Invalid configuration"}</p>
      </div>
    </div>
  );
};
