"use client";

import { type ElementType, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  GlobeIcon,
  PhoneCallIcon,
  HeadphonesIcon,
  Maximize2Icon,
  MessageCircleIcon,
  Minimize2Icon,
  SendIcon,
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
import { AIInputTextarea } from "@workspace/ui/components/ai/input";
import { AIResponse } from "@workspace/ui/components/ai/response";
import { Button } from "@workspace/ui/components/button";
import { Form, FormField } from "@workspace/ui/components/form";
import { Hint } from "@workspace/ui/components/hint";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
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
    description: "The visitor may still need help.",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200",
    icon: MessageCircleIcon,
  },
  escalated: {
    title: "Escalated",
    description: "Keep responses personal.",
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200",
    icon: HeadphonesIcon,
  },
  resolved: {
    title: "Resolved",
    description: "Reopen before replying.",
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
  const triggerSummarization = useMutation(api.private.conversations.triggerSummarization);
  const {
    isConversationExpanded,
    toggleConversationExpanded,
  } = useConversationLayoutControls();

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
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

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      await triggerSummarization({ conversationId });
      toast.success("Summary generation started.");
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
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

  const formatContactIdentifier = (identifier?: string) => {
    if (!identifier) return "";
    if (identifier.startsWith("messenger:")) {
      return `ID: ${identifier.replace("messenger:", "")}`;
    }
    if (identifier.startsWith("whatsapp:")) {
      return identifier.replace("whatsapp:", "");
    }
    return identifier;
  };
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

  const meta = conversation.contactSession?.metadata;
  const isWhatsApp = !!meta?.whatsappFrom;
  const isMessenger = !!meta?.messengerId;
  const ChannelIcon = isWhatsApp ? PhoneCallIcon : isMessenger ? MessageCircleIcon : GlobeIcon;
  const channelName = isWhatsApp ? "WhatsApp" : isMessenger ? "Messenger" : "Web Chat";
  const channelColor = isWhatsApp ? "text-emerald-500" : isMessenger ? "text-blue-500" : "text-sky-500";

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/40 dark:bg-slate-950/20">
      <header className="shrink-0 border-b border-border/70 bg-background px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <DiceBearAvatar
              seed={conversation.contactSessionId}
              size={44}
              className="ring-1 ring-border"
              imageUrl={conversation.contactSession?.metadata?.avatarUrl}
            />
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                  {contactName}
                </h1>
                <InfoPopover title="Message direction" className="size-4 text-muted-foreground/50">
                  Visitor messages appear on the left. Your replies appear on the right.
                </InfoPopover>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground/80">
                {contactEmail ? (
                  <>
                    <span className="truncate max-w-[150px]">{formatContactIdentifier(contactEmail)}</span>
                    <span className="opacity-40">•</span>
                  </>
                ) : null}
                <span>{createdAgo}</span>
                <span className="opacity-40">•</span>
                <span>{messageCount} msgs</span>
                <span className="opacity-40">•</span>
                <span className="flex items-center gap-1 font-medium">
                  <ChannelIcon className={cn("size-3", channelColor)} />
                  {channelName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start xl:self-auto">
            <Hint text={nextStatusLabel[status]} side="bottom">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className="h-8 gap-2 border-border/60 bg-background px-2.5 font-medium text-muted-foreground shadow-sm hover:border-border hover:text-foreground"
                aria-label={nextStatusLabel[status]}
              >
                <ConversationStatusBadge status={status} className="border-0 bg-transparent p-0 shadow-none text-[12px]" />
                <ChevronRightIcon className="size-3.5 opacity-50" />
              </Button>
            </Hint>

            {(isResolved || isEscalated) ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-8 gap-1.5 px-3 text-[12px] shadow-sm text-sky-600 border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400">
                    <Wand2Icon className="size-3.5" />
                    Summary
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Wand2Icon className="size-4 text-sky-500" />
                      Conversation Summary
                    </DialogTitle>
                    <DialogDescription>
                      Generated automatically by the AI assistant.
                    </DialogDescription>
                  </DialogHeader>

                  {conversation?.summary || conversation?.tags?.length ? (
                    <>
                      <div className="py-2 text-sm leading-relaxed text-foreground">
                        {conversation.summary}
                      </div>
                      {conversation.tags?.length ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {conversation.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-500/10">
                        <Wand2Icon className="size-5 text-sky-500" />
                      </div>
                      <h3 className="text-sm font-medium mb-1">No summary available</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This conversation doesn't have an AI-generated summary yet.
                      </p>
                      <Button onClick={handleGenerateSummary} disabled={isGeneratingSummary} size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                        {isGeneratingSummary ? "Generating..." : "Generate Summary"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ) : null}

            <Hint text={isConversationExpanded ? "Return to split view" : "Expand conversation"} side="bottom">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={toggleConversationExpanded}
                className="h-8 w-8 text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
              >
                {isConversationExpanded ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
              </Button>
            </Hint>
          </div>
        </div>
      </header>

      <AIConversation className="min-h-0 flex-1">
        <AIConversationContent className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 lg:px-6 space-y-4">
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
            </div>
          ) : (
            uiMessages.map((message, index) => {
              const isVisitor = message.role === "user";
              const previous = uiMessages[index - 1];
              const next = uiMessages[index + 1];
              const isFirstInGroup = !previous || previous.role !== message.role;
              const isLastInGroup = !next || next.role !== message.role;
              const isOnlyMessage = isFirstInGroup && isLastInGroup;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full group",
                    isVisitor ? "justify-start" : "justify-end",
                    !isFirstInGroup && "mt-0.5"
                  )}
                >
                  <div className={cn("flex max-w-[80%] items-end gap-2", !isVisitor && "flex-row-reverse")}>
                    {/* Visitor Avatar */}
                    {isVisitor && (
                      <div className="w-6 shrink-0 flex items-end">
                        {isLastInGroup && (
                          <DiceBearAvatar
                            seed={conversation.contactSessionId}
                            size={24}
                          />
                        )}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className="flex flex-col relative group">
                      <div
                        className={cn(
                          "px-3.5 py-2 text-[14.5px] leading-relaxed break-words shadow-sm",
                          isVisitor
                            ? "bg-muted/60 text-foreground border border-border/40"
                            : "bg-sky-500 text-white",
                          // Smart rounding
                          isVisitor && isFirstInGroup && "rounded-t-2xl rounded-r-2xl rounded-bl-sm",
                          isVisitor && !isFirstInGroup && "rounded-r-2xl rounded-l-sm",
                          isVisitor && isLastInGroup && "rounded-bl-2xl",
                          isVisitor && isOnlyMessage && "rounded-2xl rounded-bl-sm",
                          
                          !isVisitor && isFirstInGroup && "rounded-t-2xl rounded-l-2xl rounded-br-sm",
                          !isVisitor && !isFirstInGroup && "rounded-l-2xl rounded-r-sm",
                          !isVisitor && isLastInGroup && "rounded-br-2xl",
                          !isVisitor && isOnlyMessage && "rounded-2xl rounded-br-sm"
                        )}
                      >
                        <AIResponse dir="auto" className={cn("w-full", !isVisitor && "text-right")}>
                          {message.text}
                        </AIResponse>
                      </div>

                      {/* Copy button outside bubble */}
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                        isVisitor ? "-right-10" : "-left-10"
                      )}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCopyMessage(message.id, message.text)}
                          className="size-7 rounded-full bg-background/50 backdrop-blur-sm border shadow-sm"
                        >
                          {copiedMessageId === message.id ? (
                            <CheckIcon className="size-3.5 text-sky-500" />
                          ) : (
                            <CopyIcon className="size-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <AIConversationScrollButton />
        </AIConversationContent>
      </AIConversation>

      {(isResolved || isEscalated) && (
        <div className="shrink-0 flex justify-center py-2 relative z-10">
          <div className={cn("inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium shadow-sm border", banner.className)}>
            <BannerIcon className="size-3 shrink-0" />
            <span>{banner.title}</span>
          </div>
        </div>
      )}

      <div className="shrink-0 bg-background px-4 py-4 pb-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto max-w-5xl relative rounded-xl border border-border/80 bg-background shadow-sm focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all flex flex-col"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <AIInputTextarea
                  {...field}
                  className="border-0 focus-visible:ring-0 shadow-none bg-transparent px-4 py-3 min-h-[60px] resize-none"
                  placeholder={
                    isResolved
                      ? "Reopen the conversation to reply"
                      : "Type your reply..."
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

            <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/10 rounded-b-xl">
              <div className="text-[10px] text-muted-foreground/50 hidden sm:block">
                Enter to send &nbsp;·&nbsp; Shift+Enter for new line
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!draft.trim() || isSending || isEnhancing || isResolved}
                  onClick={handleEnhanceResponse}
                  className="h-7 text-xs gap-1.5 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-500/10"
                >
                  <Wand2Icon className="size-3 text-sky-500" />
                  {isEnhancing ? "..." : "Enhance"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSend}
                  className="h-7 min-w-16 text-xs gap-1.5 bg-sky-500 text-white hover:bg-sky-600"
                >
                  {isSending ? "..." : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export const ConversationIdViewLoading = () => (
  <div className="flex h-full flex-col bg-background">
    <div className="border-b border-border/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
    </div>
    <div className="flex-1 p-6" />
  </div>
);
