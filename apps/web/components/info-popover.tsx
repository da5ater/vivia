"use client";

import * as React from "react";
import { InfoIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

interface InfoPopoverProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoPopover({ title, children, className }: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "size-6 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground",
            className
          )}
          aria-label={title ? `More about ${title}` : "More information"}
        >
          <InfoIcon className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-72 text-sm">
        {title ? (
          <p className="mb-1.5 font-semibold text-foreground">{title}</p>
        ) : null}
        <div className="leading-relaxed text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
