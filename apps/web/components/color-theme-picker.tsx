"use client";

import * as React from "react";
import { CheckIcon, PaletteIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  COLOR_THEMES,
  type ColorThemeKey,
  useColorTheme,
} from "@/components/color-theme-provider";

const Swatch = ({
  theme,
  isActive,
  onClick,
  size = "default",
}: {
  theme: (typeof COLOR_THEMES)[number];
  isActive: boolean;
  onClick: () => void;
  size?: "default" | "sm";
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Use ${theme.label} accent`}
        className={cn(
          "relative rounded-full border border-black/10 outline-none transition-all duration-200 dark:border-white/15",
          "hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          size === "default" ? "size-5" : "size-4",
          isActive && "scale-110 shadow-sm"
        )}
        style={{
          backgroundColor: theme.swatch,
          "--tw-ring-color": theme.swatch,
        } as React.CSSProperties}
      >
        {isActive && (
          <CheckIcon
            className={cn(
              "absolute inset-0 m-auto text-white drop-shadow-sm",
              size === "default" ? "size-2.5" : "size-2"
            )}
            strokeWidth={3}
          />
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" sideOffset={8}>
      {theme.label}
    </TooltipContent>
  </Tooltip>
);

export function ColorThemePicker({ isOpen }: { isOpen: boolean }) {
  const { colorTheme, setColorTheme } = useColorTheme();
  const activeTheme =
    COLOR_THEMES.find((theme) => theme.key === colorTheme) ?? COLOR_THEMES[0]!;

  return (
    <TooltipProvider delayDuration={150}>
      {isOpen ? (
        <div className="flex items-center gap-2 px-1 py-1">
          <PaletteIcon className="size-3.5 shrink-0 text-muted-foreground/60" />
          <div className="flex flex-wrap items-center gap-1.5">
            {COLOR_THEMES.map((theme) => (
              <Swatch
                key={theme.key}
                theme={theme}
                isActive={colorTheme === theme.key}
                onClick={() => setColorTheme(theme.key as ColorThemeKey)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-1">
          <Swatch
            theme={activeTheme}
            isActive
            onClick={() => {
              const index = COLOR_THEMES.findIndex(
                (theme) => theme.key === colorTheme
              );
              const nextTheme = COLOR_THEMES[(index + 1) % COLOR_THEMES.length];
              if (nextTheme) setColorTheme(nextTheme.key as ColorThemeKey);
            }}
            size="sm"
          />
        </div>
      )}
    </TooltipProvider>
  );
}
