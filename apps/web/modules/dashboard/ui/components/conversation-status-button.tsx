import { Doc } from "@workspace/backend/convex/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Hint } from "@workspace/ui/components/hint";
import { cn } from "@workspace/ui/lib/utils";
import {
  conversationStatusMeta,
  type ConversationStatus,
} from "@/components/conversation-status-badge";

interface ConversationStatusButtonProps {
  status: Doc<"conversations">["status"];
  onClick: () => void;
  disabled?: boolean;
}

const nextAction: Record<ConversationStatus, string> = {
  unresolved: "Escalate this conversation to human follow-up",
  escalated: "Mark this conversation as resolved",
  resolved: "Reopen this conversation",
};

export const ConversationStatusButton = ({
  status,
  onClick,
  disabled,
}: ConversationStatusButtonProps) => {
  const currentStatus = (status || "unresolved") as ConversationStatus;
  const meta =
    conversationStatusMeta[currentStatus] ?? conversationStatusMeta.unresolved;
  const Icon = meta.icon;

  return (
    <Hint text={nextAction[currentStatus]} side="bottom">
      <Button
        variant="outline"
        onClick={onClick}
        size="sm"
        disabled={disabled}
        className={cn(
          "gap-2 border px-3 font-semibold shadow-xs",
          meta.className
        )}
      >
        <Icon className="size-4" />
        {meta.label}
      </Button>
    </Hint>
  );
};
