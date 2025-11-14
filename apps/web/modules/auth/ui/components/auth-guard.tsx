"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Authlayout } from "../layouts/auth-layout";
import { SignInView } from "../views/signin-view";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AuthLoading>
        <Authlayout>
          <div>Loading...</div>
        </Authlayout>
      </AuthLoading>
      <Authenticated>
        <Authlayout>{children}</Authlayout>
      </Authenticated>
      <Unauthenticated>
        <Authlayout>
          <SignInView />
        </Authlayout>
      </Unauthenticated>
    </>
  );
};
