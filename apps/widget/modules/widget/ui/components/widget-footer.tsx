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
    <footer className="flex items-center justify-between border-t bg-background mt-auto">
      {/* Home Button: Takes the user back to the main selection screen */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-14 flex-1 rounded-none",
          screen === "selection" && "text-primary"
        )}
        onClick={() => {
          setScreen("selection");
        }}
      >
        <Home className="size-5" />
      </Button>

      {/* Inbox Button: Takes the user to their message history */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-14 flex-1 rounded-none",
          screen === "inbox" && "text-primary"
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
