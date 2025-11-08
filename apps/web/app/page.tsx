"use client";

import { Button } from "@workspace/ui/components/button";
import { add } from "@workspace/math/add";
import { Input } from "@workspace/ui/components/input";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";

export default function Page() {
  const users = useQuery(api.users.getMany);
  const addUser = useMutation(api.users.createUser);

  return (
    <>
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

function Content() {
  const users = useQuery(api.users.getMany);

  return <div>users number: {users?.length}</div>;
}
