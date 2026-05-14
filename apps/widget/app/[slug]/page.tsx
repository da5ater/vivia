"use client";

// --- Imports ---
import { use } from "react";
import { WidgetView } from "@/modules/widget/ui/views/widget-view";

// --- Type Definitions ---
interface PageProps {
  params: Promise<{ slug: string }>;
}

// --- Page Controller ---
export default function Page({ params }: PageProps) {
  // --- Data Unwrapping ---
  const { slug } = use(params);

  // --- View Injection ---
  return <WidgetView slug={slug} />;
}
