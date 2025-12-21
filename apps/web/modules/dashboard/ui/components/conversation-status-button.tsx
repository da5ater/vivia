import { Doc } from "@workspace/backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Hint } from "@workspace/ui/components/hint";
import { ArrowRightIcon, ArrowUpIcon, Check } from "lucide-react";

interface ConversationStatusButtonProps {
  status: Doc<"conversations">["status"];
  onClick: () => void;
  disabled?: boolean;
}

export const ConversationStatusButton = ({
  status,
  onClick,
  disabled,
}: ConversationStatusButtonProps) => {
  if (status === "resolved") {
    return (
      <Hint text="mark as unresolved">
        <Button
          variant="tertiary"
          onClick={onClick}
          size="sm"
          disabled={disabled}
        >
          <Check />
          resolved
        </Button>
      </Hint>
    );
  }

  if (status === "escalated") {
    return (
      <Hint text="mark as resolved">
        <Button
          variant="destructive"
          onClick={onClick}
          size="sm"
          disabled={disabled}
        >
          <ArrowRightIcon />
          Escalated
        </Button>
      </Hint>
    );
  }

  return (
    <Hint text="mark as escalated">
      <Button variant="warning" onClick={onClick} size="sm" disabled={disabled}>
        <ArrowUpIcon />
        Unresolved
      </Button>
    </Hint>
  );
};
