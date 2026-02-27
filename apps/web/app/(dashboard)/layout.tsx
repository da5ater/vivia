import { DashboardLayout } from "@/modules/auth/ui/views/dashboard/ui/layouts/dashboard-layout";
import { SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/modules/auth/ui/views/dashboard/ui/components/dashboard-sidebar";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const cookieSTore = await cookies();
  const sidebarCookie = cookieSTore.get("sidebar-state")?.value !== "false";

  return (
    <DashboardLayout>
      <SidebarProvider defaultOpen={sidebarCookie} className="h-full">
        <DashboardSidebar />
        <div className="flex-1 overflow-auto flex flex-col min-w-0">
          {/* Topbar with always-visible trigger */}
          <div
            className="flex items-center px-4 h-12 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <SidebarTrigger
              className="size-[30px] rounded-[8px] border border-white/[0.07] bg-white/[0.03] text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-all duration-150"
            />
          </div>
          {children}
        </div>
      </SidebarProvider>
    </DashboardLayout>
  );
};

export default Layout;