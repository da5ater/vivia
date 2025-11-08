"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ConvexReactClient } from "convex/react";

// Imports from the Clerk/Convex docs
import { useAuth } from "@clerk/nextjs"; // <-- Changed from clerk-react to nextjs
import { ConvexProviderWithClerk } from "convex/react-clerk";

// This initialization is correct for Next.js
const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Your Theme Provider from Block 1
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {/* This is the merged part. 
        We replace the simple <ConvexProvider> with <ConvexProviderWithClerk>.
        It uses the useAuth hook to connect Convex to Clerk's session.
        This component MUST be inside a <ClerkProvider> (in your layout.tsx).
      */}
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </NextThemesProvider>
  );
}
