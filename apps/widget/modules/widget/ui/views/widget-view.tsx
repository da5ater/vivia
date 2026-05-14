"use client";
import { WidgetChatScreen } from "../screens/WidgetChatScreen";
import { WidgetAutScreen } from "@/modules/ui/screens/WidgetAutScreen";
import { WidgetFooter } from "../components/widget-footer";
import { WidgetHeader } from "../components/widget-header";
import { useAtomValue, useSetAtom } from "jotai";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { WidgetScreen } from "../../types";
import { JSX } from "react";
import { useEffect } from "react";
import { WidgetErrorScreen } from "../screens/WidgetErrorScreen";
import { WidgetLoadingScreen } from "../screens/WidgetLoadingScreen";
import { WidgetInboxScreen } from "../screens/widgetInboxScreen";
import { WidgetSelectionScreen } from "../screens/WidgetSelectionScreen";
import { WidgetVoiceScreen } from "../screens/Widget-Voice-Screen";
import { WidgetContactScreen } from "../screens/Widget-Contact-Screen";

interface WidgetViewProps {
  slug: string;
}

const PlaceHolder = ({ name }: { name: string }) => {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
      {name} Placeholder
    </div>
  );
};

export const WidgetView = ({ slug }: WidgetViewProps) => {
  const screen = useAtomValue(widgetScreenAtom);
  const setScreen = useSetAtom(widgetScreenAtom);

  useEffect(() => {
    setScreen("loading");
  }, [slug, setScreen]);

  const screenComponent: Record<WidgetScreen, JSX.Element> = {
    auth: <WidgetAutScreen />,
    error: <WidgetErrorScreen />,
    loading: <WidgetLoadingScreen slug={slug} />,
    selection: <WidgetSelectionScreen />,
    voice: <WidgetVoiceScreen />,
    inbox: <WidgetInboxScreen />,
    chat: <WidgetChatScreen />,
    contact: <WidgetContactScreen />,
  };

  return (
    <main className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background">
      {screenComponent[screen]}
    </main>
  );
};
