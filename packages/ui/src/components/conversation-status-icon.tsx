import { ArrowRightIcon, ArrowUpIcon, CheckIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface ConversationStatusIconProps {
  status: "resolved" | "unresolved" | "escalated";
}

const statusConfig = {
  resolved: {
    icon: CheckIcon,
    bgColor: "bg-green-500",
    title: "Resolved",
  },
  unresolved: {
    icon: ArrowUpIcon,
    bgColor: "bg-yellow-500",
    title: "Unresolved",
  },
  escalated: {
    icon: ArrowRightIcon,
    bgColor: "bg-red-500",
    title: "Escalated",
  },
};

export const ConversationStatusIcon = ({
  status,
}: ConversationStatusIconProps) => {
  const { icon: Icon, bgColor, title } = statusConfig[status];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full p-1.5 shrink-0",
        bgColor,
        "size-8"
      )}
    >
      <Icon className="size-4 stroke-[3] text-white" />
    </div>
  );
};
