import { MessageSquareTextIcon, PanelRightIcon } from "lucide-react";

export const ConversationsView = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted/45">
        <MessageSquareTextIcon className="size-6 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-base font-semibold text-foreground">
        Select a conversation
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Choose a visitor from the queue to read the thread, reply, and review
        contact context in the side panel.
      </p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/35 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <PanelRightIcon className="size-3.5" />
        Contact details open on the right
      </div>
    </div>
  );
};
