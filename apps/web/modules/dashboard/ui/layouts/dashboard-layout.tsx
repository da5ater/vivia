import React from "react";
// Assuming AuthGuard is a custom HOC that checks auth status
import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// --- Layout Component Definition ---
export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    // --- Authentication Boundary ---
    // Wraps the entire dashboard. If not authenticated, redirects occur here.
    <AuthGuard>
      {/* --- Semantic Structure --- */}
      {/* flex-1 ensures it takes available height. flex-col stacks children vertically. */}
      <main className="flex flex-1 flex-col">{children}</main>
    </AuthGuard>
  );
};
