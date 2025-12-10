// packages/ui/hooks/useInfiniteScroll.ts

import { useCallback, useEffect, useRef } from "react";

export interface UseInfiniteScrollProps {
  // Status states matching the backend/store definitions
  status: "canLoadMore" | "loadingMore" | "exhausted" | "loadingFirstPage";
  loadMore: (count: number) => void;
  loadSize?: number;
  observerEnabled?: boolean;
}

export const useInfiniteScroll = ({
  status,
  loadMore,
  loadSize = 10,
  observerEnabled = true,
}: UseInfiniteScrollProps) => {
  // Ref for the element that triggers the load (e.g., the top message)
  const topElementRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (status === "canLoadMore") {
      loadMore(loadSize);
    }
  }, [status, loadMore, loadSize]);

  useEffect(() => {
    const topElement = topElementRef.current;

    // Safety check: if element doesn't exist or observer is disabled, exit
    if (!topElement || !observerEnabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger load only if the element is intersecting (visible)
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1, // 10% visibility triggers the action
      }
    );

    observer.observe(topElement);

    // Cleanup to prevent memory leaks
    return () => {
      observer.disconnect();
    };
  }, [handleLoadMore, observerEnabled]);

  return {
    topElementRef,
    canLoadMore: status === "canLoadMore",
    isLoadingMore: status === "loadingMore",
    isLoadingFirstPage: status === "loadingFirstPage",
    isExhausted: status === "exhausted",
  };
};
