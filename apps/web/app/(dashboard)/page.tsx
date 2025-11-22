"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";

export default function Page() {
  const users = useQuery(api.users.getMany);
  const addUser = useMutation(api.users.createUser);

  return <div></div>;
}
