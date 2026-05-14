"use client";

import { Authenticated, Unauthenticated, AuthLoading, useMutation } from "convex/react";
import { Authlayout } from "../layouts/auth-layout";
import { SignInView } from "../views/signin-view";
import { useEffect } from "react";
import { api } from "@workspace/backend/convex/_generated/api";

const UserSync = ({ children }: { children: React.ReactNode }) => {
  const syncUser = useMutation(api.users.syncUser);
  
  useEffect(() => {
    syncUser().catch(console.error);
  }, [syncUser]);

  return <>{children}</>;
};

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <AuthLoading>
        <Authlayout>
          <div>Loading...</div>
        </Authlayout>
      </AuthLoading>
      <Authenticated>
        <UserSync>{children}</UserSync>
      </Authenticated>
      <Unauthenticated>
        <Authlayout>
          <SignInView />
        </Authlayout>
      </Unauthenticated>
    </>
  );
};
