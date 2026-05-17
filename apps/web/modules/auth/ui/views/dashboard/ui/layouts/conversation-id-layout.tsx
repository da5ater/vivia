"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ContactPanel } from "@/modules/dashboard/ui/components/contact-panel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@workspace/ui/components/resizable";
import { cn } from "@workspace/ui/lib/utils";

// ─── Context ────────────────────────────────────────────────────────────────

type ConversationLayoutControls = {
  isConversationExpanded: boolean;
  toggleConversationExpanded: () => void;
  isContactPanelOpen: boolean;
  toggleContactPanel: () => void;
};

const ConversationLayoutControlsContext =
  createContext<ConversationLayoutControls>({
    isConversationExpanded: false,
    toggleConversationExpanded: () => {},
    isContactPanelOpen: true,
    toggleContactPanel: () => {},
  });

export const useConversationLayoutControls = () =>
  useContext(ConversationLayoutControlsContext);

// ─── Conversation Expanded Overlay Modal ────────────────────────────────────

const ConversationOverlayModal = ({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger enter animation after mount
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Trap keyboard escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Expanded conversation view"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 sm:p-6 lg:p-8",
        mounted ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[6px] transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className={cn(
          "relative z-10 flex h-full w-full max-h-[min(820px,calc(100dvh-2rem))] max-w-[min(1100px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl transition-all duration-300",
          // Subtle ring glow
          "ring-1 ring-primary/10",
          mounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        style={{
          boxShadow:
            "0 32px 80px -24px oklch(0 0 0 / 0.45), 0 0 0 1px oklch(0.55 0.22 265 / 0.08)",
        }}
      >
        {/* Content fills the modal */}
        <div className="flex h-full min-h-0 flex-col">{children}</div>
      </div>
    </div>
  );
};

// ─── Main Layout ─────────────────────────────────────────────────────────────

export const ConversationIdLayout = ({ children }: { children: ReactNode }) => {
  const [isContactPanelOpen, setIsContactPanelOpen] = useState(true);
  const [isConversationExpanded, setIsConversationExpanded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Show the docked panel only when: large screen + panel open + not in expanded overlay
  const shouldShowDockedPanel =
    isLargeScreen && isContactPanelOpen && !isConversationExpanded;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => {
      setIsLargeScreen(mediaQuery.matches);
      // On small screens, always close the docked panel
      if (!mediaQuery.matches) setIsContactPanelOpen(false);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const controls = useMemo(
    () => ({
      isConversationExpanded,
      toggleConversationExpanded: () =>
        setIsConversationExpanded((current) => !current),
      isContactPanelOpen,
      toggleContactPanel: () => setIsContactPanelOpen((current) => !current),
    }),
    [isConversationExpanded, isContactPanelOpen]
  );

  return (
    <ConversationLayoutControlsContext.Provider value={controls}>
      <div className="relative flex h-full flex-1 overflow-hidden bg-background">
        {/* ── Normal layout (resizable panels) ─────────────────────────── */}
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full flex-1"
        >
          {/* Main conversation panel */}
          <ResizablePanel className="h-full" defaultSize={shouldShowDockedPanel ? 65 : 100}>
            <div className="flex h-full flex-col">
              {children}
            </div>
          </ResizablePanel>

          {/* Docked contact panel — slides in/out */}
          {shouldShowDockedPanel && (
            <>
              <ResizableHandle className="w-[3px] bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/30" />
              <ResizablePanel
                className={cn(
                  "h-full border-l border-border/60 bg-background transition-all duration-300",
                  "data-[panel-size='0.0']:hidden"
                )}
                defaultSize={35}
                maxSize={42}
                minSize={26}
              >
                {/* Animated slide wrapper */}
                <div
                  className={cn(
                    "h-full w-full overflow-hidden transition-all duration-300 ease-out",
                    isContactPanelOpen
                      ? "translate-x-0 opacity-100"
                      : "translate-x-full opacity-0"
                  )}
                >
                  <ContactPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* ── Expanded conversation overlay modal ──────────────────────── */}
        {isConversationExpanded && (
          <ConversationOverlayModal
            onClose={() => setIsConversationExpanded(false)}
          >
            {children}
          </ConversationOverlayModal>
        )}

        {/* ── Mobile/small-screen contact panel (bottom sheet style) ───── */}
        {!isLargeScreen && isContactPanelOpen && !isConversationExpanded && (
          <>
            {/* Mobile backdrop */}
            <div
              className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsContactPanelOpen(false)}
              aria-hidden="true"
            />
            {/* Slide-in panel from right */}
            <div
              className={cn(
                "absolute inset-y-0 right-0 z-40 w-[min(92vw,420px)] overflow-hidden border-l border-border/60 bg-background shadow-2xl transition-transform duration-300 ease-out",
              )}
            >
              <ContactPanel />
            </div>
          </>
        )}
      </div>
    </ConversationLayoutControlsContext.Provider>
  );
};
