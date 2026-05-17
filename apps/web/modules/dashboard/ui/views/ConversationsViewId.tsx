"use client";

import { type ElementType, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckIcon,
  ChevronRightIcon,
  Clock3Icon,
  CopyIcon,
  HeadphonesIcon,
  MailIcon,
  Maximize2Icon,
  MessageCircleIcon,
  Minimize2Icon,
  SendIcon,
  UserRoundIcon,
  Wand2Icon,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { api } from "@workspace/backend/convex/_generated/api";
import { Id } from "@workspace/backend/convex/_generated/dataModel";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";
import { AIInput, AIInputTextarea } from "@workspace/ui/components/ai/input";
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";
import { AIResponse } from "@workspace/ui/components/ai/response";
import { Button } from "@workspace/ui/components/button";
import { Form, FormField } from "@workspace/ui/components/form";
import { Hint } from "@workspace/ui/components/hint";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import { ConversationStatusBadge, type ConversationStatus } from "@/components/conversation-status-badge";
import { InfoPopover } from "@/components/info-popover";
import { useConversationLayoutControls } from "@/modules/auth/ui/views/dashboard/ui/layouts/conversation-id-layout";

const formSchema = z.object({
  message: z.string().trim().min(1, "Message is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ConversationsViewIdProps {
  conversationId: Id<"conversations">;
}

const statusBannerMeta: Record<
  ConversationStatus,
  { title: string; description: string; className: string; icon: ElementType }
> = {
  unresolved: {
    title: "Open conversation",
    description: "The visitor may still need help. Reply or escalate when needed.",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    icon: MessageCircleIcon,
  },
  escalated: {
    title: "Escalated to human support",
    description: "Keep the response personal and resolve once the issue is handled.",
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200",
    icon: HeadphonesIcon,
  },
  resolved: {
    title: "Resolved conversation",
    description: "Reopen the conversation before sending another response.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200",
    icon: SendIcon,
  },
};

const nextStatusLabel: Record<ConversationStatus, string> = {
  unresolved: "Escalate to human support",
  escalated: "Mark as resolved",
  resolved: "Reopen conversation",
};

export const ConversationsViewId = ({
  conversationId,
}: ConversationsViewIdProps) => {
  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { message: "" },
  });

  const createMessage = useAction(api.private.messages.create);
  const updateStatus = useMutation(api.private.conversations.updateStatus);
  const enhanceResponse = useAction(api.private.messages.enhanceResponse);
  const {
    isConversationExpanded,
    toggleConversationExpanded,
  } = useConversationLayoutControls();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messages = useThreadMessages(
    api.private.messages.getMany,
    conversation?.threadId ? { threadId: conversation.threadId } : "skip",
    { initialNumItems: 24 }
  );

  const { topElementRef, canLoadMore, isLoadingMore } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 6,
    observerEnabled: false,
  });

  const onSubmit = async (values: FormValues) => {
    const prompt = values.message.trim();
    if (!prompt) return;

    try {
      await createMessage({ prompt, conversationId });
      form.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send message";
      toast.error(message);
    }
  };

  const handleToggleStatus = async () => {
    if (!conversation) return;

    setIsUpdatingStatus(true);

    const newStatus =
      conversation.status === "unresolved"
        ? "escalated"
        : conversation.status === "escalated"
          ? "resolved"
          : "unresolved";

    try {
      await updateStatus({ conversationId, status: newStatus });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleEnhanceResponse = async () => {
    const draftContent = form.getValues("message");
    if (!draftContent.trim() || !conversation) return;

    setIsEnhancing(true);
    try {
      const enhancedText = await enhanceResponse({
        prompt: draftContent,
        threadId: conversation.threadId,
      });
      form.setValue("message", enhancedText, { shouldValidate: true });
    } catch (error) {
      console.error("Failed to enhance response:", error);
      toast.error("Failed to enhance response");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopyMessage = async (messageId: string, text: string) => {
    if (!navigator?.clipboard) return;

    await navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    window.setTimeout(() => setCopiedMessageId(null), 1600);
  };

  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />;
  }

  const contactName = conversation.contactSession?.name || "Anonymous visitor";
  const contactEmail = conversation.contactSession?.email;
  const status = (conversation.status || "unresolved") as ConversationStatus;
  const banner = statusBannerMeta[status];
  const BannerIcon = banner.icon;
  const isResolved = status === "resolved";
  const isEscalated = status === "escalated";
  const draft = form.watch("message") ?? "";
  const isSending = form.formState.isSubmitting;
  const canSend = !isResolved && !isSending && draft.trim().length > 0;
  const uiMessages = toUIMessages(messages.results ?? []).filter(
    (message) => typeof message.text === "string" && message.text.trim()
  );
  const messageCount = uiMessages.length;
  const createdAgo = formatDistanceToNow(new Date(conversation._creationTime), {
    addSuffix: true,
  });

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/70 dark:bg-slate-950/20">
      <header className="shrink-0 border-b border-border/70 bg-background px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <DiceBearAvatar
              seed={conversation.contactSessionId}
              size={44}
              className="ring-1 ring-border"
            />
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                  {contactName}
                </h1>
                <ConversationStatusBadge status={status} />
                <InfoPopover title="Message direction" className="size-6">
                  Visitor messages appear on the left. Your replies appear on
                  the right. Message text follows the detected language
                  direction automatically.
                </InfoPopover>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {contactEmail ? (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <MailIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{contactEmail}</span>
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <Clock3Icon className="size-3.5" />
                  Started {createdAgo}
                </span>
                <span>{messageCount} messages</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start xl:self-auto">
            {/* Expand/minimize overlay */}
            <Hint
              text={isConversationExpanded ? "Return to split view" : "Expand conversation"}
              side="bottom"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={toggleConversationExpanded}
                className="text-muted-foreground hover:text-foreground"
                aria-label={isConversationExpanded ? "Return to split view" : "Expand conversation"}
              >
                {isConversationExpanded ? (
                  <Minimize2Icon className="size-4" />
                ) : (
                  <Maximize2Icon className="size-4" />
                )}
              </Button>
            </Hint>

            {/* Compact status cycle button — icon + chevron, no loud color */}
            <Hint text={nextStatusLabel[status]} side="bottom">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="h-8 gap-1.5 border-border/60 bg-background px-2.5 text-xs font-medium text-muted-foreground shadow-xs hover:border-border hover:text-foreground"
                aria-label={nextStatusLabel[status]}
              >
                <ConversationStatusBadge status={status} className="border-0 bg-transparent p-0 shadow-none" />
                <ChevronRightIcon className="size-3 opacity-50" />
              </Button>
            </Hint>
          </div>
        </div>
      </header>

      {(isResolved || isEscalated) && (
        <div className="shrink-0 border-b border-border/60 bg-background px-4 py-3">
          <div
            className={cn(
              "mx-auto flex max-w-4xl items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
              banner.className
            )}
          >
            <BannerIcon className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">{banner.title}</p>
              <p className="mt-0.5 text-xs opacity-80">{banner.description}</p>
            </div>
          </div>
        </div>
      )}

      {(conversation?.summary || conversation?.tags?.length) && (
        <div className="shrink-0 border-b border-border/70 bg-background/95 px-4 py-4 backdrop-blur">
          {conversation.summary && (
            <p className="max-w-4xl text-sm leading-6 text-foreground">
              {conversation.summary}
            </p>
          )}

          {conversation.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {conversation.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <AIConversation className="min-h-0 flex-1">
        <AIConversationContent className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 lg:px-6">
          <InfiniteScrollTrigger
            ref={topElementRef}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => messages.loadMore(6)}
          />

          {messageCount === 0 ? (
            <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <MessageCircleIcon className="size-5 text-muted-foreground" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                No messages yet
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                The thread will stay here once the visitor writes in.
              </p>
            </div>
          ) : (
            uiMessages.map((message, index) => {
              const isVisitor = message.role === "user";
              const previous = uiMessages[index - 1];
              const next = uiMessages[index + 1];
              const isFirstInGroup = !previous || previous.role !== message.role;
              const isLastInGroup = !next || next.role !== message.role;
              const label = isVisitor ? contactName : "You";
              const copyLabel =
                copiedMessageId === message.id ? "Copied" : "Copy message";

              return (
                <AIMessage
                  key={message.id}
                  from={isVisitor ? "assistant" : "user"}
                  className={cn(
                    "items-end py-1.5 [&>div]:max-w-none",
                    isFirstInGroup ? "mt-3" : "mt-0.5",
                    isVisitor
                      ? "!flex-row !justify-start"
                      : "!flex-row !justify-end"
                  )}
                  aria-label={isVisitor ? "Visitor message" : "Operator reply"}
                >
                  <AIMessageContent
                    className={cn(
                      "max-w-[min(780px,88%)] rounded-2xl px-4 py-3 shadow-xs sm:max-w-[min(780px,82%)]",
                      isVisitor
                        ? "border border-slate-200 bg-white text-slate-950 dark:border-slate-700/70 dark:bg-slate-900/90 dark:text-slate-100 [background-image:none]"
                        : "border-0 bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm dark:from-blue-500/80 dark:to-blue-600/80",
                      isVisitor && isLastInGroup && "rounded-bl-md",
                      !isVisitor && isLastInGroup && "rounded-br-md"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-3",
                        !isVisitor && "flex-row-reverse text-right"
                      )}
                    >
                      {isLastInGroup ? (
                        isVisitor ? (
                          <DiceBearAvatar
                            seed={conversation.contactSessionId}
                            size={30}
                            className="mt-0.5 shrink-0"
                          />
                        ) : (
                          <div className="mt-0.5 flex size-[30px] shrink-0 items-center justify-center rounded-full bg-white/15 text-white dark:bg-sky-300/15 dark:text-sky-100">
                            <UserRoundIcon className="size-4" />
                          </div>
                        )
                      ) : (
                        <span className="size-[30px] shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        {isFirstInGroup ? (
                          <div
                            className={cn(
                              "mb-1 flex items-center gap-2",
                              !isVisitor && "justify-end"
                            )}
                          >
                            <p
                              className={cn(
                                "min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em]",
                                isVisitor
                                  ? "text-muted-foreground"
                                  : "text-white/75 dark:text-sky-100/75"
                              )}
                            >
                              {label}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                handleCopyMessage(message.id, message.text)
                              }
                              className={cn(
                                "size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                                isVisitor
                                  ? "text-muted-foreground hover:text-foreground"
                                  : "text-white/75 hover:bg-white/10 hover:text-white dark:text-sky-100/75 dark:hover:bg-sky-100/10 dark:hover:text-sky-50"
                              )}
                              aria-label={copyLabel}
                              title={copyLabel}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckIcon className="size-3.5" />
                              ) : (
                                <CopyIcon className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : null}
                        <AIResponse
                          dir="auto"
                          className="text-sm leading-6 [text-align:start]"
                        >
                          {message.text}
                        </AIResponse>
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

      <div className="shrink-0 border-t border-border/70 bg-background px-4 py-3">
        <Form {...form}>
          <AIInput
            className="mx-auto max-w-5xl rounded-xl border-border/70 p-2 shadow-sm"
            onSubmit={form.handleSubmit(onSubmit)}
          >
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <AIInputTextarea
                    {...field}
                    minHeight={72}
                    placeholder={
                      isResolved
                        ? "Reopen the conversation to reply"
                        : `Reply to ${contactName}...`
                    }
                    disabled={isResolved || isSending}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                )}
              />

              <div className="flex flex-col gap-2 px-1 pb-1 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Enter to send. Shift + Enter for a new line.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span
                    className={cn(
                      "text-xs tabular-nums text-muted-foreground",
                      draft.length > 1200 && "text-amber-600 dark:text-amber-300"
                    )}
                  >
                    {draft.length}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!draft.trim() || isSending || isEnhancing || isResolved}
                    onClick={handleEnhanceResponse}
                    className="gap-2 shadow-xs"
                  >
                    <Wand2Icon className="size-4 text-sky-500" />
                    {isEnhancing ? "Enhancing..." : "Enhance"}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!canSend}
                    className="min-w-24 bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
                  >
                    <SendIcon className="size-4" />
                    {isSending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
          </AIInput>
        </Form>
      </div>
    </div>
  );
};

export const ConversationIdViewLoading = () => (
  <div className="flex h-full flex-col bg-muted/20">
    <div className="border-b border-border/70 bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>

    <div className="flex-1 space-y-4 overflow-hidden p-5">
      {Array.from({ length: 8 }).map((_, index) => {
        const isOperator = index % 3 === 0;

        return (
          <div
            key={index}
            className={cn("flex gap-3", isOperator && "flex-row-reverse")}
          >
            <Skeleton className="size-8 rounded-full" />
            <Skeleton
              className={cn(
                "h-14 rounded-2xl",
                isOperator ? "w-72" : "w-80"
              )}
            />
          </div>
        );
      })}
    </div>

    <div className="border-t border-border/70 bg-background p-4">
      <Skeleton className="mx-auto h-28 max-w-5xl rounded-xl" />
    </div>
  </div>
);
