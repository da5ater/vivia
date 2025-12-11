import { Home, Inbox } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { set } from "zod/v4";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { useAtomValue, useSetAtom } from "jotai";

export const WidgetFooter = () => {
  // --- State Simulation ---
  // Hardcoded for now, will be replaced by Jotai state later
  let screen = useAtomValue(widgetScreenAtom);

  const setScreen = useSetAtom(widgetScreenAtom);

  // --- Render Logic ---
  return (
    <footer className="flex items-center justify-between border-t bg-background mt-auto">
      {/* --- Navigation Item: Home --- */}
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

      {/* --- Navigation Item: Inbox --- */}
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
