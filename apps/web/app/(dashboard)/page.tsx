"use client";

import { Button } from "@workspace/ui/components/button";
import { add } from "@workspace/math/add";
import { Input } from "@workspace/ui/components/input";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";

export default function Page() {
  const users = useQuery(api.users.getMany);
  const addUser = useMutation(api.users.createUser);

  return (
    <div>
      {users === undefined && <p>Loading...</p>}
      {users && (
        <>
          <ul>
            {users.map((user) => (
              <li key={user._id}>{user.name}</li>
            ))}
          </ul>
          <Button
            onClick={() =>
              addUser({ name: "Alice", email: "alice@example.com" })
            }
          >
            Add User
          </Button>
          <Content />
        </>
      )}
    </div>
  );
}

function Content() {
  const users = useQuery(api.users.getMany);

  return <div>users number: {users?.length}</div>;
}
