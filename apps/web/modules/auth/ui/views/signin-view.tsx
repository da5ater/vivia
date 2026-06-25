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
      <div className="flex w-full items-center justify-center px-4 py-6">
        <SignIn 
          routing="hash" 
          appearance={{ 
            elements: { 
              header: "hidden", 
              rootBox: "w-full", 
              cardBox: "shadow-none border-none bg-transparent w-full m-0 p-0",
              main: "flex flex-col w-full gap-4",
              formButtonPrimary: "w-full",
              socialButtonsBlockButton: "w-full flex justify-center items-center"
            } 
          }} 
        />
      </div>
    </div>
  );
};
