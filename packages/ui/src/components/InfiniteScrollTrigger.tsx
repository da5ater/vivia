// packages/ui/components/InfiniteScrollTrigger.tsx

import { forwardRef } from "react";
import { cn } from "@workspace/ui/lib/utils";

import { Button } from "@workspace/ui/components/button";

interface InfiniteScrollTriggerProps {
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  loadMoreText?: string;
  noMoreText?: string;
  className?: string;
}

// forwardRef is required to allow the hook to attach the IntersectionObserver to this DOM element
export const InfiniteScrollTrigger = forwardRef<
  HTMLDivElement,
  InfiniteScrollTriggerProps
>(
  (
    {
      canLoadMore,
      isLoadingMore,
      onLoadMore,
      loadMoreText = "Load more",
      noMoreText = "No more items",
      className,
    },
    ref
  ) => {
    let text = loadMoreText;

    if (isLoadingMore) {
      text = "Loading...";
    } else if (!canLoadMore) {
      text = noMoreText;
    }

    return (
      <div
        className={cn("flex w-full justify-center py-2", className)}
        ref={ref} // The tripwire anchor
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={!canLoadMore || isLoadingMore}
          onClick={onLoadMore}
        >
          {text}
        </Button>
      </div>
    );
  }
);

InfiniteScrollTrigger.displayName = "InfiniteScrollTrigger";
