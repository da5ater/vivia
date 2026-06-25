"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";

import { ReactNode } from "react";
import { ConversationsPanel } from "../components/conversations-panel";

import { useIsMobile } from "@workspace/ui/hooks/use-mobile";

interface ConversationsLayoutProps {
  children: ReactNode;
}

export const ConversationsLayout = ({ children }: ConversationsLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <ResizablePanelGroup
      direction={isMobile ? "vertical" : "horizontal"}
      className="h-full w-full flex-1 overflow-hidden rounded-xl border border-border/60 bg-background"
    >
      <ResizablePanel minSize={24} defaultSize={32} maxSize={38}>
        <ConversationsPanel />
      </ResizablePanel>
      <ResizableHandle className={`w-1 bg-border/70 transition-colors hover:bg-primary/25 z-10 ${isMobile ? 'cursor-row-resize h-1 w-full' : 'cursor-col-resize'}`} />

      <ResizablePanel defaultSize={68} className="flex-1 h-full">
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
