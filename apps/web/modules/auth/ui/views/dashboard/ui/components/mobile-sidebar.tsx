"use client";

import { MenuIcon } from "lucide-react";
import { DashboardSidebar } from "./dashboard-sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Button } from "@workspace/ui/components/button";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="size-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[240px]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <DashboardSidebar className="flex md:flex w-full" isMobile={true} />
      </SheetContent>
    </Sheet>
  );
};
