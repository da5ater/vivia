import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

export type ConversationStatus = "unresolved" | "resolved" | "escalated";

export const conversationStatusMeta: Record<
  ConversationStatus,
  {
    label: string;
    description: string;
    icon: LucideIcon;
    className: string;
    dotClassName: string;
  }
> = {
  unresolved: {
    label: "Open",
    description: "Needs a reply or operator review.",
    icon: Clock3Icon,
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  escalated: {
    label: "Escalated",
    description: "A human operator should take over.",
    icon: AlertCircleIcon,
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  resolved: {
    label: "Resolved",
    description: "Closed unless the visitor writes again.",
    icon: CheckCircle2Icon,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
};

interface ConversationStatusBadgeProps {
  status: ConversationStatus;
  showIcon?: boolean;
  className?: string;
}

export function ConversationStatusBadge({
  status,
  showIcon = true,
  className,
}: ConversationStatusBadgeProps) {
  const meta = conversationStatusMeta[status];
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-semibold", meta.className, className)}
    >
      {showIcon ? <Icon className="size-3" /> : null}
      {meta.label}
    </Badge>
  );
}
