import { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";

// --- Interface Contract ---
interface WidgetHeaderProps {
  children: ReactNode;
  className?: string;
}

// --- Component Definition ---
export const WidgetHeader = ({ children, className }: WidgetHeaderProps) => {
  // --- Style Encapsulation ---
  // Enforces the "Brand" gradient (primary-2 to blue) while allowing overrides via cn()
  return (
    <header
      className={cn(
        "bg-gradient-to-b from-primary to-[#0063f3] p-4 text-primary-foreground",
        className
      )}
    >
      {children}
    </header>
  );
};
