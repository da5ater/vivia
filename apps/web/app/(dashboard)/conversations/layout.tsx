import { ConversationsLayout } from "@/modules/auth/ui/views/dashboard/ui/layouts/conversations-layout";
import { ReactNode } from "react";

interface DashboardConversationsLayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: DashboardConversationsLayoutProps) => {
  return <ConversationsLayout>{children}</ConversationsLayout>;
};

export default Layout;
