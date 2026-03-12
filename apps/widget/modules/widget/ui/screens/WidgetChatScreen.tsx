"use client";

import { AISuggestion, AISuggestions } from "@workspace/ui/components/ai/suggestion";
import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";

import { WidgetHeader } from "../components/widget-header";
import { WidgetFooter } from "../components/widget-footer";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  HeadphonesIcon,
  MessageCircleIcon,
  SparklesIcon,
} from "lucide-react";

import {
  conversationIdAtom,
  contactSessionIdAtom,
  widgetScreenAtom,
  widgetSettingsAtom,
} from "../../atoms/widget-atoms";

import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";

import {
  AIInput,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input";

import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";

import { AIResponse } from "@workspace/ui/components/ai/response";
import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField } from "@workspace/ui/components/form";

import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import { DiceBearAvatar } from "@workspace/ui/components/DiceBearAvatar";
import { cn } from "@workspace/ui/lib/utils";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const EmptyConversation = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
      <MessageCircleIcon className="size-5 text-primary" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium">Start the conversation</p>
      <p className="text-xs text-muted-foreground">
        Ask anything — we're here to help.
      </p>
    </div>
  </div>
);

const ResolvedBanner = () => (
  <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400">
    <CheckCircle2Icon className="size-3.5 shrink-0" />
    <span>This conversation has been marked as resolved.</span>
  </div>
);

const EscalatedBanner = () => (
  <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
    <HeadphonesIcon className="size-3.5 shrink-0" />
    <span>This conversation has been escalated to a human agent.</span>
  </div>
);

export const WidgetChatScreen = () => {
  const widgetSettings = useAtomValue(widgetSettingsAtom);
  const conversationId = useAtomValue(conversationIdAtom);
  const contactSessionId = useAtomValue(contactSessionIdAtom);

  const setScreen = useSetAtom(widgetScreenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);

  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId
      ? { conversationId, contactSessionId }
      : "skip"
  );

  const threadId = conversation?.threadId;
  const isResolved = conversation?.status === "resolved";
  const isEscalated = conversation?.status === "escalated";
  const isDone = isResolved || isEscalated;

  const suggestions = useMemo(() => {
    const vals = Object.values(widgetSettings?.defaultSuggestions ?? {});
    return vals.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
  }, [widgetSettings?.defaultSuggestions]);

  const messages = useThreadMessages(
    api.public.messages.getMany,
    threadId && contactSessionId
      ? { threadId, contactSessionId }
      : "skip",
    { initialNumItems: 50 }
  );

  const uiMessages = toUIMessages(messages.results ?? []).filter(
    (message) =>
      typeof message.text === "string" && message.text.trim().length > 0
  );

  const handleBackToChat = () => {
    setConversationId(null);
    setScreen("selection");
  };

  const createdMessage = useAction(api.public.messages.create);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
    mode: "onChange",
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!threadId || !contactSessionId) return;
    form.reset();
    await createdMessage({
      threadId,
      contactSessionId,
      prompt: values.message,
    });
  };

  const { topElementRef, canLoadMore, isLoadingMore } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 5,
    observerEnabled: false,
  });

  const showSuggestions = uiMessages.length === 1 && suggestions.length > 0;

  return (
    <>
      <WidgetHeader className="flex items-center gap-3 py-3">
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
          onClick={handleBackToChat}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            <DiceBearAvatar
              seed="assistant"
              imageUrl="/vivia-logo.png"
              imageClassName="object-contain p-0.5"
              className="size-9 border-2 border-white/20"
            />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-wide text-primary-foreground">
              Assistant
            </p>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", isDone ? "bg-muted-foreground/40" : "bg-green-400")} />
              <p className="truncate text-xs text-primary-foreground/80">
                {isResolved ? "Resolved" : isEscalated ? "Escalated to Support" : "Online"}
              </p>
            </div>
          </div>
        </div>
      </WidgetHeader>

      {uiMessages.length === 0 && messages.status !== "LoadingFirstPage" ? (
        <EmptyConversation />
      ) : (
        <AIConversation className="flex-1 overflow-hidden">
          <AIConversationContent className="px-3 pb-3 pt-2">
            <InfiniteScrollTrigger
              ref={topElementRef}
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={() => messages.loadMore(10)}
            />

            {uiMessages.map((message, index) => {
              if (!message.text?.trim()) return null;

              const isUser = message.role === "user";
              const prev = uiMessages[index - 1];
              const next = uiMessages[index + 1];
              const isFirst = !prev || prev.role !== message.role;
              const isLast = !next || next.role !== message.role;

              return (
                <AIMessage
                  key={message.id}
                  from={isUser ? "user" : "assistant"}
                  className={cn(isFirst ? "mt-3" : "mt-0.5", "py-0")}
                >
                  <div
                    className={cn(
                      "flex max-w-[82%] flex-col gap-0.5",
                      isUser ? "items-end" : "items-start"
                    )}
                  >
                    {isFirst && (
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        {isUser ? "You" : "Assistant"}
                      </p>
                    )}

                    <AIMessageContent
                      className={cn(
                        !isUser && isLast ? "rounded-bl-sm" : "",
                        isUser && isLast ? "rounded-br-sm" : "",
                        !isFirst ? "pt-1.5" : ""
                      )}
                    >
                      <AIResponse>{message.text}</AIResponse>
                    </AIMessageContent>
                  </div>

                  {!isUser && isLast && (
                    <DiceBearAvatar
                      seed="assistant"
                      imageUrl="/vivia-logo.png"
                      imageClassName="object-contain p-0.5"
                      className="mb-1 self-end"
                    />
                  )}
                </AIMessage>
              );
            })}
          </AIConversationContent>

          <AIConversationScrollButton />
        </AIConversation>
      )}

      {showSuggestions && (
        <div className="border-t bg-background/50 px-3 py-2">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
            <SparklesIcon className="size-3" />
            <span>Suggested</span>
          </div>
          <AISuggestions className="flex w-full flex-row flex-wrap gap-1.5 p-0">
            {suggestions.map((suggestion) => (
              <AISuggestion
                key={suggestion}
                suggestion={suggestion}
                className="h-auto whitespace-normal text-left text-xs"
                onClick={() => {
                  form.setValue("message", suggestion, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                  form.handleSubmit(onSubmit)();
                }}
              />
            ))}
          </AISuggestions>
        </div>
      )}

      {isResolved && <ResolvedBanner />}
      {isEscalated && <EscalatedBanner />}

      <Form {...form}>
        <AIInput
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-none border-x-0 border-b-0"
        >
          <FormField
            control={form.control}
            disabled={isDone}
            name="message"
            render={({ field }) => (
              <AIInputTextarea
                {...field}
                placeholder={
                  isResolved
                    ? "This conversation has been resolved"
                    : isEscalated
                      ? "Escalated to a human agent"
                      : "Type your message…"
                }
                disabled={isDone}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }
                }}
              />
            )}
          />

          <AIInputToolbar>
            {!isDone && (
              <p className="select-none text-[10px] text-muted-foreground/50">
                ↵ to send · ⇧↵ for newline
              </p>
            )}

            <AIInputTools className="ml-auto">
              <AIInputSubmit
                disabled={!form.formState.isValid || isDone}
                status={isSubmitting ? "submitted" : "ready"}
                type="submit"
              />
            </AIInputTools>
          </AIInputToolbar>
        </AIInput>
      </Form>

      <WidgetFooter />
    </>
  );
};