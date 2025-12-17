import { DashboardLayout } from "@/modules/auth/ui/views/dashboard/ui/layouts/dashboard-layout";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/modules/auth/ui/views/dashboard/ui/components/dashboard-sidebar";
const Layout = async ({ children }: { children: React.ReactNode }) => {
  const cookieSTore = await cookies();
  const sidebarCookie = cookieSTore.get("sidebar-state")?.value === "true";

  return (
    <DashboardLayout>
      <SidebarProvider defaultOpen={sidebarCookie} className="h-full">
        <DashboardSidebar />
        {children}
      </SidebarProvider>
    </DashboardLayout>
  );
};

export default Layout;
