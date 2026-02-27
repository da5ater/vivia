"use client";

import { UserButton } from "@clerk/nextjs";
import {
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  Mic,
  PaletteIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar";

import { cn } from "@workspace/ui/lib/utils";

const customerSupportItems = [
  { label: "Conversations", href: "/conversations", icon: InboxIcon },
  { label: "Knowledge Base", href: "/files", icon: LibraryBigIcon },
];

const configurationItems = [
  { label: "Widget Customization", href: "/customization", icon: PaletteIcon },
  { label: "Integrations", href: "/integrations", icon: LayoutDashboardIcon },
  { label: "Voice Assistant", href: "/plugins/vapi", icon: Mic },
];

const accountItems = [
  { label: "Billing", href: "/billing", icon: CreditCardIcon },
];

const NavSection = ({
  label,
  items,
  isActive,
}: {
  label: string;
  items: { label: string; href: string; icon: any }[];
  isActive: (href: string) => boolean;
}) => (
  <SidebarGroup className="p-0 mb-1">
    <p className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-white/20 px-2.5 mb-1 group-data-[collapsible=icon]:hidden">
      {label}
    </p>
    <SidebarGroupContent>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.label}
                className={cn(
                  "relative h-9 rounded-[9px] text-[13px] font-medium transition-all duration-150 border border-transparent",
                  "text-white/42 hover:text-white/78 hover:bg-white/[0.04]",
                  active &&
                  "text-white! bg-gradient-to-r from-indigo-500/18 to-blue-500/10! border-indigo-500/20!"
                )}
              >
                <Link href={item.href} className="flex items-center gap-2.5 px-2.5">
                  {active && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-indigo-400 to-blue-400"
                      style={{ boxShadow: "0 0 10px rgba(129,140,248,0.7)" }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-all duration-150",
                      active ? "text-indigo-300" : "text-white/30 group-hover:text-white/60"
                    )}
                    style={active ? { filter: "drop-shadow(0 0 5px rgba(129,140,248,0.5))" } : {}}
                  />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

export const DashboardSidebar = () => {
  const pathname = usePathname();
  const { toggleSidebar, open } = useSidebar();

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  };

  return (
    <Sidebar
      collapsible="icon"
      style={{
        background: "linear-gradient(160deg, #0f0f17 0%, #0a0a10 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <SidebarRail />

      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 w-48 h-48 pointer-events-none z-0"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <SidebarHeader className="px-3.5 pt-5 pb-4 relative z-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2">
              {/* Logo */}
              <SidebarMenuButton
                asChild
                tooltip="Home"
                className="h-auto! hover:bg-transparent! p-0! flex-1!"
              >
                <Link href="/" className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center size-[34px] rounded-[10px] shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                      boxShadow: "0 0 0 1px rgba(99,102,241,0.3), 0 4px 16px rgba(99,102,241,0.25)",
                    }}
                  >
                    <Image src="/vivia-logo.png" alt="Logo" width={20} height={20} className="rounded-md" />
                  </div>
                  <div className="group-data-[collapsible=icon]:hidden">
                    <p className="text-[13px] font-semibold text-white/92 tracking-tight leading-none">MyApp</p>
                    <p className="text-[10px] text-white/25 mt-0.5 tracking-wide">Workspace</p>
                  </div>
                </Link>
              </SidebarMenuButton>

              {/* Bare arrow — no box, no border, hidden when collapsed */}
              <button
                onClick={toggleSidebar}
                className="group-data-[collapsible=icon]:hidden text-white/25 hover:text-white/70 transition-colors duration-150 p-1 shrink-0"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Gradient divider under header only */}
      <div
        className="mx-3.5 mb-3.5 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
        }}
      />

      {/* Nav — no dividers between sections */}
      <SidebarContent className="px-2 gap-0 relative z-10">
        <NavSection label="Support" items={customerSupportItems} isActive={isActive} />
        <NavSection label="Configuration" items={configurationItems} isActive={isActive} />
        <NavSection label="Account" items={accountItems} isActive={isActive} />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter
        className="px-2 py-3 relative z-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              showName
              appearance={{
                elements: {
                  rootBox: "w-full! h-[42px]!",
                  userButtonTrigger:
                    "w-full! px-2.5! py-2! rounded-[9px]! border border-transparent hover:bg-white/[0.04]! hover:border-white/[0.06]! group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-1.5! transition-all! duration-150!",
                  userButtonBox:
                    "w-full! flex-row-reverse! justify-end! gap-2.5! group-data-[collapsible=icon]:justify-center!",
                  userButtonOuterIdentifier:
                    "pl-0! text-[12px]! font-medium! text-white/65! group-data-[collapsible=icon]:hidden!",
                  avatarBox: "size-[26px]! ring-1! ring-indigo-500/30!",
                },
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};