/**
 * Widget Footer Component
 * 
 * This component renders the bottom navigation bar of the chat widget.
 * It allows users to switch between the "Home" (selection) screen and 
 * the "Inbox" screen to view their messages.
 */

import { Home, Inbox } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { useAtomValue, useSetAtom } from "jotai";

/**
 * The footer navigation bar.
 * 
 * It highlights the icon for the screen that is currently active.
 */
export const WidgetFooter = () => {
  // Get the current screen name and a function to change it
  const screen = useAtomValue(widgetScreenAtom);
  const setScreen = useSetAtom(widgetScreenAtom);

  return (
    <footer className="mt-auto flex items-center justify-between border-t bg-background">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open support home"
        className={cn(
          "h-14 flex-1 rounded-none text-muted-foreground",
          screen === "selection" && "bg-muted/50 text-primary"
        )}
        onClick={() => {
          setScreen("selection");
        }}
      >
        <Home className="size-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Open conversation inbox"
        className={cn(
          "h-14 flex-1 rounded-none text-muted-foreground",
          screen === "inbox" && "bg-muted/50 text-primary"
        )}
        onClick={() => {
          setScreen("inbox");
        }}
      >
        <Inbox className="size-5" />
      </Button>
    </footer>
  );
};
