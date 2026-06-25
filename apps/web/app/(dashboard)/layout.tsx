import { DashboardLayout } from "@/modules/auth/ui/views/dashboard/ui/layouts/dashboard-layout";
import { ThemeToggle } from "@workspace/ui/components/theme-toggle";
import { DashboardSidebar } from "@/modules/auth/ui/views/dashboard/ui/components/dashboard-sidebar";
import { MobileSidebar } from "@/modules/auth/ui/views/dashboard/ui/components/mobile-sidebar";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardLayout>
      <div className="flex h-full overflow-hidden bg-sidebar selection:bg-primary/20">
        <DashboardSidebar />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-border/60 bg-background shadow-sm transition-all duration-300 my-0 mx-0 rounded-none border-x-0 border-y-0 md:my-2 md:mr-2 md:ml-0 lg:ml-2 md:rounded-xl md:border">
          <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 md:px-6 backdrop-blur transition-all duration-200">
            <div className="flex items-center gap-2 md:gap-4">
              <MobileSidebar />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Vivia Workspace
                </span>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  Operator console
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </header>

          <main className="flex w-full flex-1 flex-col overflow-y-auto p-5 custom-scrollbar lg:p-7">
            {children}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Layout;
