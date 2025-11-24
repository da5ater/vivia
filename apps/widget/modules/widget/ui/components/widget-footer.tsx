import { Home, Inbox } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export const WidgetFooter = () => {
  // --- State Simulation ---
  // Hardcoded for now, will be replaced by Jotai state later
  let screen = "home";

  // --- Render Logic ---
  return (
    <footer className="flex items-center justify-between border-t bg-background">
      {/* --- Navigation Item: Home --- */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-14 flex-1 rounded-none",
          screen === "home" && "text-primary"
        )}
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
      >
        <Inbox className="size-5" />
      </Button>
    </footer>
  );
};
