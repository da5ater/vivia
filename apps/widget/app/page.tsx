"use client";

// --- Imports ---
import { use } from "react";
import { WidgetView } from "@/modules/widget/ui/views/widget-view";

// --- Type Definitions ---
// Next.js specifically types searchParams as a Promise in generic page props
interface PageProps {
  searchParams: Promise<{ organizationId: string }>;
}

// --- Page Controller ---
export default function Page({ searchParams }: PageProps) {
  // --- Data Unwrapping ---
  // The "Primitive Hunt": We need the string value from the Promise wrapper.
  // We use the React `use` hook to unwrap the promise safely within a client component context.
  const { organizationId } = use(searchParams);

  // --- View Injection ---
  // Pass the unwrapped primitive to the presentation layer.
  return <WidgetView>""</WidgetView>;
}
