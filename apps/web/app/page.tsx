import { Button } from "@workspace/ui/components/button";
import { add } from "@workspace/math/add";
import { Input } from "@workspace/ui/components/input";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <p>The sum of 2 and 3 is: {add(2, 3)}</p>
      <Input placeholder="Type something..." />
    </div>
  );
}
