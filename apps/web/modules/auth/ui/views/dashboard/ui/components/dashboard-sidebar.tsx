"use client";

// --- Imports ---
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  CreditCardIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  Mic,
  PaletteIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Import UI primitives from our local shadcn setup
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";

import { cn } from "@workspace/ui/lib/utils";

// --- Configuration Data ---
// Defined outside component to prevent re-creation on every render
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

export const DashboardSidebar = () => {
  // --- Hooks ---
  const pathname = usePathname();

  // --- Active State Logic ---
  // Determines if a menu item should be highlighted based on current URL
  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(url);
  };

  return (
    // --- Sidebar Container ---
    // 'collapsible="icon"' enables the behavior where it shrinks to icons only
    <Sidebar className="group border-r" collapsible="icon">
      <SidebarRail />

      {/* --- Header Section --- */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Home">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/vivia-logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="rounded-md"
                />
                <span className="font-bold text-lg">MyApp</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* --- Main Content Groups --- */}
      <SidebarContent>
        {/* Group 1: Customer Support */}
        <SidebarGroup>
          <SidebarGroupLabel>Customer Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerSupportItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  {/* asChild allows the Link to receive styles from SidebarMenuButton */}
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className={cn(
                      isActive(item.href) &&
                        "bg-gradient-to-b from-sidebar-primary to-[#0b63f3]! text-sidebar-primary-foreground! hover:to-[#0b63f3]/90!"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4 mr-2" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2: Configuration */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className={cn(
                      isActive(item.href) &&
                        "bg-gradient-to-b from-sidebar-primary to-[#0b63f3]! text-sidebar-primary-foreground! hover:to-[#0b63f3]/90!"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4 mr-2" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 3: Account */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className={cn(
                      isActive(item.href) &&
                        "bg-gradient-to-b from-sidebar-primary to-[#0b63f3]! text-sidebar-primary-foreground! hover:to-[#0b63f3]/90!"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4 mr-2" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* --- Footer & Clerk Integration --- */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              showName
              // --- Magic String Styling ---
              // We use `appearance` to inject Tailwind classes into Clerk's iframe/components.
              // The `group-data-[collapsible=icon]` selector detects if the parent
              // Sidebar is collapsed. If so, we hide the name and adjust padding/size.
              appearance={{
                elements: {
                  rootBox: "w-full! h-8!",
                  userButtonTrigger:
                    "w-full! p-2! hover:bg-sidebar-accent! hover:text-sidebar-accent-foreground! group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
                  userButtonBox:
                    "w-full! flex-row-reverse! justify-end! gap-2! group-data-[collapsible=icon]:justify-center! text-sidebar-foreground!",
                  userButtonOuterIdentifier:
                    "pl-0! group-data-[collapsible=icon]:hidden!",
                  avatarBox: "size-4!",
                },
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
