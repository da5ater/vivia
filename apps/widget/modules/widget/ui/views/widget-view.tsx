"use client";
import { WidgetChatScreen } from "../screens/WidgetChatScreen";
import { WidgetAutScreen } from "@/modules/ui/screens/WidgetAutScreen";
import { WidgetFooter } from "../components/widget-footer";
import { WidgetHeader } from "../components/widget-header";
import { useAtomValue } from "jotai";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { WidgetScreen } from "../../types";
import { JSX } from "react";
import { WidgetErrorScreen } from "../screens/WidgetErrorScreen";
import { WidgetLoadingScreen } from "../screens/WidgetLoadingScreen";
interface WidgetViewProps {
  children: React.ReactNode;
}

import { WidgetSelectionScreen } from "../screens/WidgetSelectionScreen";

const PlaceHolder = ({ name }: { name: string }) => {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
      {name} Placeholder
    </div>
  );
};

export const WidgetView = ({ children }: WidgetViewProps) => {
  const screen = useAtomValue(widgetScreenAtom);

  const screenComponent: Record<WidgetScreen, JSX.Element> = {
    auth: <WidgetAutScreen />,
    error: <WidgetErrorScreen />,
    loading: <WidgetLoadingScreen />,
    selection: <WidgetSelectionScreen />,
    voice: <PlaceHolder name="Voice Screen" />,
    inbox: <PlaceHolder name="Inbox Screen" />,
    chat: <WidgetChatScreen />,
    contact: <PlaceHolder name="Contact Screen" />,
  };

  return (
    <main className="min-h-screen min-w-screen flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background">
      {screenComponent[screen]}
    </main>
  );
};
