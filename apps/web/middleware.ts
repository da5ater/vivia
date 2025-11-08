import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// This is from Block 2: Defines your public routes
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Add any other public routes here (e.g., '/', '/about')
]);

// This is the merged logic
export default clerkMiddleware(async (auth, req) => {
  // Check if the route is NOT on the public list
  if (!isPublicRoute(req)) {
    // If it's not public, protect it.
    // This will redirect unauthenticated users to the sign-in page.
    await auth.protect();
  }
});

// This is from Block 1: Defines *which* routes the middleware runs on
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
