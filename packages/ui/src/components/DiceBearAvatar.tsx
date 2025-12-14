// packages/ui/components/DiceBearAvatar.tsx

"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { glass } from "@dicebear/collection"; // Using 'glass' style
import { cn } from "@workspace/ui/lib/utils";

import { Avatar, AvatarImage } from "@workspace/ui/components/avatar"; // Optional: if using a shared Avatar component"}

interface DiceBearAvatarProps {
  seed: string;
  size?: number;
  className?: string;
  badgeClassName?: string;
  imageUrl?: string;
  badgeImageUrl?: string;
  imageClassName?: string;
}
export const DiceBearAvatar = ({
  seed,
  size = 32,
  className,
  badgeClassName,
  imageUrl,
  badgeImageUrl,
  imageClassName,
}: DiceBearAvatarProps) => {
  // Memoize generation to avoid expensive recalculation
  const avatarSource = useMemo(() => {
    // If an explicit image is provided, we might use that (Note: Current logic prioritizes this calculation but logic below overrides it via img src if provided)
    // Actual Logic: We generate the SVG URI regardless, but the usage depends on the renderer.

    // Generating the procedural avatar
    const avatar = createAvatar(glass, {
      seed: seed.toLowerCase().trim(),
      // 'size' in options ensures the SVG internal viewbox is correct
    });

    return avatar.toDataUri();
  }, [seed]);

  const badgeSize = Math.round(size * 0.5);

  return (
    <div
      className="relative inline-block"
      style={{ width: size, height: size }}
    >
      <Avatar
        className={cn("overflow-hidden rounded-full border", className)}
        style={{ width: size, height: size }}
      >
        {/* Prioritize external imageUrl if provided, fallback to DiceBear source */}
        <AvatarImage
          src={imageUrl || avatarSource}
          alt="Avatar"
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </Avatar>

      {badgeImageUrl && (
        <div
          className={cn(
            "absolute bottom-0 right-0 flex items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background",
            badgeClassName
          )}
          style={{
            width: badgeSize,
            height: badgeSize,
            // Offset to make it look like a notification badge/flag
            transform: "translate(15%, 15%)",
          }}
        >
          <img
            src={badgeImageUrl}
            alt="Badge"
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
};
