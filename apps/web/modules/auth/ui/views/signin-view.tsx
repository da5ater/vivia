"use client";

import { SignIn } from "@clerk/nextjs";

export const SignInView = () => {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
      <SignIn routing="hash" />
    </div>
  );
};
