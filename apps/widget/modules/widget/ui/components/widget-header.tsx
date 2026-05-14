/**
 * Widget Header Component
 * 
 * This component renders the top section of the chat widget.
 * It uses a consistent blue gradient background to match the Vivia brand
 * and serves as a container for titles, organization names, or navigation.
 */

import { ReactNode } from "react";
import { cn } from "@workspace/ui/lib/utils";

/**
 * Properties for the WidgetHeader component.
 * @param children - The elements to be displayed inside the header (like text or icons).
 * @param className - Optional extra CSS classes for custom styling.
 */
interface WidgetHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * The header component itself.
 * 
 * Simple Example:
 * <WidgetHeader>
 *   <h1>Support Chat</h1>
 * </WidgetHeader>
 */
export const WidgetHeader = ({ children, className }: WidgetHeaderProps) => {
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
