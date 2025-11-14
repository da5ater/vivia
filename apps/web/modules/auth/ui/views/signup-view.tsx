"use client";

import { SignUp } from "@clerk/nextjs";

export const SignUpView = () => {
  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow">
      <SignUp routing="hash" />
    </div>
  );
};
