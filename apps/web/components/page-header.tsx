import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="max-w-3xl space-y-2.5">
        <div className="flex items-center gap-2 text-primary">
          {Icon ? <Icon className="size-4" /> : null}
          <span className="text-xs font-semibold uppercase tracking-[0.14em]">
            {eyebrow}
          </span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
