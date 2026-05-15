"use client";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Id } from "@workspace/backend/convex/_generated/dataModel";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock3Icon,
  MailIcon,
  MessageCircleIcon,
  SparklesIcon,
  UserRoundIcon,
  Wand2,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "../../../../../../packages/ui/src/components/ai/conversation";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import {
  AIMessage,
  AIMessageContent,
} from "../../../../../../packages/ui/src/components/ai/message";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { AIResponse } from "../../../../../../packages/ui/src/components/ai/response";
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "../../../../../../packages/ui/src/components/ai/input";
import { Form, FormField } from "@workspace/ui/components/form";
import { useState } from "react";
import { ConversationStatusButton } from "../components/conversation-status-button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toast } from "sonner";
import { cn } from "@workspace/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";

const forSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
});

type FormValues = z.infer<typeof forSchema>;

interface ConversationsViewIdProps {
  conversationId: Id<"conversations">;
}

export const ConversationsViewId = ({
  conversationId,
}: ConversationsViewIdProps) => {
  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(forSchema),
    mode: "onChange",
    defaultValues: {
      message: "",
    },
  });

  const createMessage = useAction(api.private.messages.create);

  const onSubmit = async (values: FormValues) => {
    try {
      await createMessage({
        prompt: values.message,
        conversationId: conversationId,
      });
      form.reset();
    } catch (error) {
      console.error("Failed to create message:", error);
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  const messages = useThreadMessages(
    api.private.messages.getMany,
    conversation?.threadId ? { threadId: conversation.threadId } : "skip",
    { initialNumItems: 20 },
  );

  const updateStatus = useMutation(api.private.conversations.updateStatus);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleToggleStatus = async () => {
    if (!conversation) return;

    setIsUpdatingStatus(true);

    let newStatus: "resolved" | "escalated" | "unresolved";

    if (conversation.status === "unresolved") {
      newStatus = "escalated";
    } else if (conversation.status === "escalated") {
      newStatus = "resolved";
    } else {
      newStatus = "unresolved";
    }

    try {
      await updateStatus({
        conversationId: conversationId,
        status: newStatus,
      });
    } catch (error) {
      console.error("Failed to update conversation status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const { topElementRef, canLoadMore, isLoadingMore } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 5,
    observerEnabled: false,
  });

  const handleLoadMore = () => {
    if (canLoadMore && !isLoadingMore) {
      messages.loadMore(5);
    }
  };

  const enhanceResponse = useAction(api.private.messages.enhanceResponse);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhanceResponse = async () => {
    if (!conversation) return;

    const currentPrompt = form.getValues("message");
    if (!currentPrompt) return;

    setIsEnhancing(true);
    try {
      const enhancedText = await enhanceResponse({
        prompt: currentPrompt,
        threadId: conversation.threadId,
      });
      form.setValue("message", enhancedText);
    } catch (error) {
      toast.error("Failed to enhance response");
      console.error("Failed to enhance response:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />;
  }

  const contactName = conversation.contactSession?.name || "Anonymous visitor";
  const contactEmail = conversation.contactSession?.email;
  const messageCount = messages.results?.length ?? 0;
  const draft = form.watch("message");
  const isResolved = conversation.status === "resolved";
  const isSending = form.formState.isSubmitting;
  const canSend = !isResolved && !isSending && draft.trim().length > 0;
  const createdAgo = formatDistanceToNow(new Date(conversation._creationTime), {
    addSuffix: true,
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.45)_100%)]">
      <header className="shrink-0 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <DiceBearAvatar
              seed={conversation.contactSessionId}
              size={42}
              className="ring-2 ring-background shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                  {contactName}
                </h1>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {messageCount} messages
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {contactEmail && (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <MailIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{contactEmail}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock3Icon className="size-3.5" />
                  Started {createdAgo}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={isResolved || isEnhancing || !draft.trim()}
              onClick={handleEnhanceResponse}
              className="hidden border-border/70 bg-background shadow-xs sm:inline-flex"
              type="button"
            >
              <SparklesIcon className="size-4" />
              Improve draft
            </Button>
            {!!conversation && (
              <ConversationStatusButton
                status={conversation.status}
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
              />
            )}
          </div>
        </div>
      </header>

      <AIConversation className="min-h-0 flex-1">
        <AIConversationContent className="mx-auto flex w-full max-w-4xl flex-col gap-1 px-4 py-6 lg:px-6">
          <InfiniteScrollTrigger
            ref={topElementRef}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
          />
          {messageCount === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm">
                <MessageCircleIcon className="size-5 text-muted-foreground" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                No messages in this conversation yet
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When the visitor writes in, the thread will stay centered here
                for quick replies.
              </p>
            </div>
          ) : (
            toUIMessages(messages.results ?? [])?.map((message) => {
              const isVisitor = message.role === "user";

              return (
                <AIMessage
                  key={message.id}
                  from={isVisitor ? "assistant" : "user"}
                  className={cn(
                    "items-start py-2.5",
                    isVisitor ? "justify-start" : "justify-end",
                  )}
                >
                  <AIMessageContent
                    className={cn(
                      "max-w-[min(760px,82%)] rounded-2xl px-4 py-3 shadow-sm",
                      isVisitor
                        ? "border-border/70 bg-background text-foreground"
                        : "border-transparent bg-primary text-primary-foreground",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {isVisitor && (
                        <DiceBearAvatar
                          seed={conversation?.contactSessionId || "user"}
                          size={30}
                          className="mt-0.5 shrink-0"
                        />
                      )}
                      {!isVisitor && (
                        <div className="mt-0.5 flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                          <UserRoundIcon className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "mb-1 text-[11px] font-semibold uppercase tracking-wide",
                            isVisitor
                              ? "text-muted-foreground"
                              : "text-primary-foreground/75",
                          )}
                        >
                          {isVisitor ? contactName : "Operator"}
                        </div>
                        <AIResponse>{message.text}</AIResponse>
                      </div>
                    </div>
                  </AIMessageContent>
                </AIMessage>
              );
            })
          )}
          <AIConversationScrollButton />
        </AIConversationContent>
      </AIConversation>

      <div className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
        {isResolved && (
          <div className="mx-auto mb-3 max-w-4xl rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300">
            This conversation is resolved. Reopen it to send another response.
          </div>
        )}
        <Form {...form}>
          <AIInput
            className="mx-auto max-w-4xl rounded-xl border-border/70 p-2 shadow-sm"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <AIInputTextarea
                  {...field}
                  minHeight={64}
                  placeholder={
                    isResolved
                      ? "Conversation resolved"
                      : `Reply to ${contactName}...`
                  }
                  disabled={isResolved || isSending || isEnhancing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                  onChange={field.onChange}
                  value={field.value}
                />
              )}
            />
            <AIInputToolbar className="px-1 pb-1 pt-2">
              <AIInputTools className="min-w-0">
                <AIInputButton
                  onClick={handleEnhanceResponse}
                  disabled={isEnhancing || !draft.trim() || isResolved}
                  className="gap-2"
                >
                  <Wand2 className="size-4" />
                  {isEnhancing ? "Improving..." : "Enhance"}
                </AIInputButton>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Enter to send, Shift + Enter for a new line
                </span>
              </AIInputTools>
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {draft.length}
                </span>
                <AIInputSubmit
                  disabled={!canSend}
                  status={isSending ? "submitted" : "ready"}
                  type="submit"
                />
              </div>
            </AIInputToolbar>
          </AIInput>
        </Form>
      </div>
    </div>
  );
};

// path: apps/web/modules/dashboard/ui/views/conversation-id-view.tsx

export const ConversationIdViewLoading = () => {
  // Generate 8 dummy messages
  const dummyMessages = Array.from({ length: 8 }, (_, i) => i);
  const widths = ["w-48", "w-60", "w-72"]; // Tailwind width classes

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* 1. Fake Header */}
      <div className="border-b bg-background p-4 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* 2. Fake Chat Content */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {dummyMessages.map((i) => {
          const isUser = i % 2 === 0; // Alternate sides
          const randomWidth = widths[i % widths.length]; // Cycle widths

          return (
            <div
              key={i}
              className={`flex w-full gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar Skeleton */}
              <Skeleton className="h-8 w-8 rounded-full" />

              {/* Message Bubble Skeleton */}
              <Skeleton className={`h-9 ${randomWidth} rounded-lg`} />
            </div>
          );
        })}
      </div>

      {/* 3. Fake Input Area */}
      <div className="p-4 border-t bg-background">
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
};
