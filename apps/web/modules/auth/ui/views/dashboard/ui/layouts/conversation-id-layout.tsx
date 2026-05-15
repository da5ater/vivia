"use client";

import { ContactPanel } from "@/modules/dashboard/ui/components/contact-panel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@workspace/ui/components/resizable";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { useState } from "react";

export const ConversationIdLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

  return (
    <div className="relative flex h-full flex-1 overflow-hidden bg-muted/30">
      <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
        <ResizablePanel
          className="h-full"
          defaultSize={isContactPanelOpen ? 66 : 100}
        >
          <div className="flex h-full flex-1 flex-col">{children}</div>
        </ResizablePanel>

        {isContactPanelOpen && (
          <>
            <ResizableHandle className="hidden w-1 bg-border/70 transition-colors hover:bg-primary/25 lg:block" />
            <ResizablePanel
              className="hidden h-full border-l border-border/60 bg-background lg:block"
              defaultSize={34}
              maxSize={38}
              minSize={24}
            >
              <ContactPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => setIsContactPanelOpen((current) => !current)}
        className={cn(
          "absolute right-4 top-4 z-20 hidden border-border/70 bg-background/95 shadow-sm backdrop-blur lg:inline-flex",
          isContactPanelOpen && "right-[calc(34%+1rem)]",
        )}
        aria-label={
          isContactPanelOpen ? "Hide contact panel" : "Show contact panel"
        }
        title={isContactPanelOpen ? "Hide contact panel" : "Show contact panel"}
      >
        {isContactPanelOpen ? (
          <PanelRightCloseIcon className="size-4" />
        ) : (
          <PanelRightOpenIcon className="size-4" />
        )}
      </Button>
    </div>
  );
};
