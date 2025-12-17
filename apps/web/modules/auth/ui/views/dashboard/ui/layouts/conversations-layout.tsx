"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";

import { ReactNode } from "react";
import { ConversationsPanel } from "../components/conversations-panel";
import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";

interface ConversationsLayoutProps {
  children: ReactNode;
}

export const ConversationsLayout = ({ children }: ConversationsLayoutProps) => {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full  flex-1"
    >
      <ResizablePanel minSize={20} defaultSize={30} maxSize={30}>
        <ConversationsPanel />
      </ResizablePanel>
      <ResizableHandle className="w-1 bg-border hover:bg-primary/20 cursor-col-resize z-10" />

      <ResizablePanel defaultSize={70} className="flex-1 h-full">
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
