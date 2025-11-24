"use client";

import { WidgetFooter } from "../components/widget-footer";
import { WidgetHeader } from "../components/widget-header";

interface WidgetViewProps {
  children: React.ReactNode;
}

export const WidgetView = ({ children }: WidgetViewProps) => {
  return (
    <main className="min-h-screen min-w-screen flex h-full w-full flex-col overflow-hidden rounded-xl border bg-muted">
      <WidgetHeader>
        <div className="flex flex-col justify-between gap-y-2 px-2 py-6">
          <p className="text-3xl font-semibold">Hi there 👋</p>
          <p className="text-lg font-semibold">How can we help you today?</p>
        </div>
      </WidgetHeader>

      <div className="flex flex-1 flex-col p-4">{children}</div>

      <WidgetFooter />
    </main>
  );
};
