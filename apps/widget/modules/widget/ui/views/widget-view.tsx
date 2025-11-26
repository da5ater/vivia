"use client";

import { WidgetAutScreen } from "@/modules/ui/screens/WidgetAutScreen";
import { WidgetFooter } from "../components/widget-footer";
import { WidgetHeader } from "../components/widget-header";

interface WidgetViewProps {
  children: React.ReactNode;
}

export const WidgetView = ({ children }: WidgetViewProps) => {
  return (
    <main className="min-h-screen min-w-screen flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background">
      <WidgetAutScreen />
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </main>
  );
};
