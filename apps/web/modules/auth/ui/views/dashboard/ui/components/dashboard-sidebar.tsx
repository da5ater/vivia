"use client";

import { UserButton } from "@clerk/nextjs";
import {
  CreditCardIcon,
  ChevronLeftIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  MessageCircle,
  Mic,
  PaletteIcon,
  PlugIcon,
  SettingsIcon,
  LightbulbIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ColorThemePicker } from "@/components/color-theme-picker";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

import { cn } from "@workspace/ui/lib/utils";

// ─── Nav data ────────────────────────────────────────────────────────────────

const customerSupportItems = [
  { label: "Overview", href: "/", icon: LayoutDashboardIcon },
  { label: "Conversations", href: "/conversations", icon: InboxIcon },
  { label: "Insights", href: "/insights", icon: LightbulbIcon },
  { label: "Knowledge Base", href: "/files", icon: LibraryBigIcon },
];

const configurationItems = [
  { label: "Widget Settings", href: "/widget-settings", icon: SettingsIcon },
  { label: "Widget Customization", href: "/customization", icon: PaletteIcon },
  { label: "Integrations", href: "/integrations", icon: PlugIcon },
  { label: "WhatsApp", href: "/whatsapp-integration", icon: MessageCircle },
  { label: "Voice Assistant", href: "/plugins/vapi", icon: Mic },
];

const accountItems = [
  { label: "Billing", href: "/billing", icon: CreditCardIcon },
];

// ─── NavItem ──────────────────────────────────────────────────────────────────

const NavItem = ({
  item,
  active,
  isCollapsed,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
  isCollapsed: boolean;
}) => {
  const content = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center h-10 w-full rounded-md font-medium transition-all duration-200 outline-none group/link active:scale-[0.98]",
        !active &&
        "text-muted-foreground hover:text-primary hover:bg-primary/[0.04] dark:hover:bg-primary/[0.06]",
        isCollapsed ? "justify-center px-0" : "px-3 gap-3",
        active && [
          "text-primary bg-primary/[0.06] hover:bg-primary/[0.1]",
          "dark:bg-primary/[0.12] dark:hover:bg-primary/[0.18]",
        ]
      )}
    >
      {/* Active left bar indicator */}
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
      )}

      {/* Icon */}
      <span
        className={cn(
          "relative flex items-center justify-center shrink-0 transition-colors duration-200",
          isCollapsed ? "size-6" : "size-5",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover/link:text-primary"
        )}
      >
        <item.icon className={cn(isCollapsed ? "size-5" : "size-[18px]")} />
      </span>

      {/* Label smoothly expands and collapses. */}
      <span
        className={cn(
          "whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden text-[13.5px]",
          isCollapsed ? "opacity-0 w-0 max-w-0" : "opacity-100 max-w-[180px]"
        )}
      >
        {item.label}
      </span>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={16} className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

// ─── NavSection ───────────────────────────────────────────────────────────────

const NavSection = ({
  label,
  items,
  isActive,
  isCollapsed,
}: {
  label: string;
  items: { label: string; href: string; icon: React.ElementType }[];
  isActive: (href: string) => boolean;
  isCollapsed: boolean;
}) => (
  <div className="flex flex-col mb-4">
    {/* Section label animates with sidebar state. */}
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isCollapsed
          ? "opacity-0 h-0"
          : "opacity-100 h-8 px-3 flex items-center"
      )}
    >
      <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground/40 select-none">
        {label}
      </p>
    </div>

    <ul className={cn("flex flex-col gap-1", isCollapsed && "items-center")}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <li key={item.href} className="w-full px-2">
            <NavItem item={item} active={active} isCollapsed={isCollapsed} />
          </li>
        );
      })}
    </ul>
  </div>
);

// ─── DashboardSidebar ─────────────────────────────────────────────────────────

export const DashboardSidebar = ({ className, isMobile }: { className?: string, isMobile?: boolean }) => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsedState, setIsCollapsedState] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedState = localStorage.getItem("sidebar-collapsed");
    if (storedState !== null) {
      setIsCollapsedState(storedState === "true");
    }
  }, []);

  const isCollapsed = isMobile ? false : isCollapsedState;

  const toggleSidebar = () => {
    if (isMobile) return;
    const newState = !isCollapsedState;
    setIsCollapsedState(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  };

  const sidebarWidthClass = isCollapsed ? "w-[72px]" : "w-[240px]";

  return (
    <aside
      className={cn(
        "hidden md:flex h-full shrink-0 flex-col bg-transparent transition-[width] duration-300 ease-in-out relative group",
        sidebarWidthClass,
        className
      )}
    >
      {/* ── Header ── */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border/30 shrink-0">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 overflow-hidden outline-none transition-all duration-300 rounded-md",
            isCollapsed ? "justify-center w-full px-0" : "px-1"
          )}
        >
          {/* Logo mark */}
          <div className="flex items-center justify-center size-[30px] shrink-0 transition-all duration-300 ml-[2px]">
            <Image
              src="/logo.png"
              alt="Vivia"
              width={26}
              height={26}
              className="object-contain drop-shadow-sm"
            />
          </div>

          {/* Brand text */}
          <div
            className={cn(
              "flex flex-col transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
              isCollapsed ? "opacity-0 w-0" : "opacity-100 max-w-[120px]"
            )}
          >
            <p className="text-[14px] font-bold text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
              Vivia
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-[3px] tracking-wide font-medium leading-none">
              Workspace
            </p>
          </div>
        </Link>
      </div>

      {/* Toggle button overlapping right border */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full w-7 h-12 border border-border/50 bg-background/95 backdrop-blur shadow-[0_0_8px_rgba(0,0,0,0.06)] text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300",
            "opacity-0 md:group-hover:opacity-100 focus:opacity-100"
          )}
        >
          <ChevronLeftIcon
            className={cn(
              "size-[18px] transition-transform duration-300 ease-in-out",
              isCollapsed && "rotate-180"
            )}
          />
        </button>
      )}

      {/* ── Nav ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 flex flex-col gap-1 custom-scrollbar">
        <TooltipProvider>
          <NavSection
            label="Support"
            items={customerSupportItems}
            isActive={isActive}
            isCollapsed={isCollapsed}
          />
          <NavSection
            label="Configuration"
            items={configurationItems}
            isActive={isActive}
            isCollapsed={isCollapsed}
          />
          <NavSection
            label="Account"
            items={accountItems}
            isActive={isActive}
            isCollapsed={isCollapsed}
          />
        </TooltipProvider>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col shrink-0 border-t border-border/40 pb-3 pt-3 px-3 gap-2">
        {!isCollapsed && isMounted && (
          <div className="px-1 mt-1 mb-2">
            <ColorThemePicker isOpen={true} />
          </div>
        )}

        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-start px-1"
          )}
        >
          {isMounted && (
            <UserButton
              showName={!isCollapsed}
              appearance={{
                elements: {
                  rootBox: cn(
                    "w-full flex transition-all duration-300",
                    isCollapsed ? "justify-center" : "justify-start"
                  ),
                  userButtonTrigger: cn(
                    "w-full transition-all duration-200 outline-none hover:bg-accent/60 p-1.5 rounded-lg border border-transparent focus:ring-2 focus:ring-primary/20",
                    isCollapsed ? "px-1.5 justify-center" : "px-2"
                  ),
                  userButtonBox: cn(
                    "w-full flex gap-3 items-center",
                    isCollapsed ? "justify-center" : "justify-start flex-row"
                  ),
                  userButtonOuterIdentifier: cn(
                    "pl-0 text-[14px] transition-all duration-200",
                    isCollapsed ? "hidden" : "block",
                    "font-medium text-muted-foreground/80",
                    "dark:font-bold dark:!text-foreground dark:!opacity-100"
                  ),
                  avatarBox: "size-7 ring-1 ring-border shrink-0 shadow-sm",
                },
              }}
            />
          )}
        </div>
      </div>
    </aside>
  );
};
