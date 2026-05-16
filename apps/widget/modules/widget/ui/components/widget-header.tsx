import { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";

interface WidgetHeaderProps {
  children: ReactNode;
  className?: string;
}

export const WidgetHeader = ({ children, className }: WidgetHeaderProps) => {
  return (
    <header
      className={cn(
        "border-b border-primary-foreground/10 bg-primary px-4 py-4 text-primary-foreground shadow-sm",
        className
      )}
    >
      {children}
    </header>
  );
};
