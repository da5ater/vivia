"use client";

import { SignUp } from "@clerk/nextjs";

export const SignUpView = () => {
  return (
    <div className="w-full rounded-lg border bg-background p-2 shadow-sm">
      <div className="px-6 pt-6 text-center">
        <h2 className="text-xl font-semibold">Create your Vivia workspace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your support widget and start helping visitors.
        </p>
      </div>
      <SignUp routing="hash" appearance={{ elements: { header: "hidden" } }} />
    </div>
  );
};
