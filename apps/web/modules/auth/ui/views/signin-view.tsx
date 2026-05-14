"use client";

import { SignIn } from "@clerk/nextjs";

export const SignInView = () => {
  return (
    <div className="w-full rounded-lg border bg-background p-2 shadow-sm">
      <div className="px-6 pt-6 text-center">
        <h2 className="text-xl font-semibold">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue to your Vivia workspace.
        </p>
      </div>
      <SignIn routing="hash" appearance={{ elements: { header: "hidden" } }} />
    </div>
  );
};
