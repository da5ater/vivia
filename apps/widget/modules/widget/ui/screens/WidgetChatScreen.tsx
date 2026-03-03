"use client";
import { AISuggestion, AISuggestions } from "@workspace/ui/components/ai/suggestion";
import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";

import { WidgetHeader } from "../components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeftIcon, MenuIcon } from "lucide-react";

import {
  conversationIdAtom,
  contactSessionIdAtom,
  widgetScreenAtom,
  widgetSettingsAtom,
} from "../../atoms/widget-atoms";

import {
  AIConversation,
  AIConversationContent,
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

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

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

  const suggestions = useMemo(() => {
    const vals = Object.values(widgetSettings?.defaultSuggestions ?? {});
    return vals.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  }, [widgetSettings?.defaultSuggestions]);

  const messages = useThreadMessages(
    api.public.messages.getMany,
    threadId && contactSessionId
      ? { threadId, contactSessionId }
      : "skip",
    { initialNumItems: 50 }
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

  return (
    <>
      <WidgetHeader className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <Button size="icon" variant="transparent" onClick={handleBackToChat}>
            <ArrowLeftIcon />
            <p>Chat</p>
          </Button>
        </div>
        <Button size="icon" variant="transparent">
          <MenuIcon />
        </Button>
      </WidgetHeader>

      <AIConversation>
        <AIConversationContent>
          <InfiniteScrollTrigger
            ref={topElementRef}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => messages.loadMore(10)}
          />

          {toUIMessages(messages.results ?? []).map((message) => (
            <AIMessage
              key={message.id}
              from={message.role === "user" ? "user" : "assistant"}
            >
              <AIMessageContent>
                <AIResponse>{message.text}</AIResponse>
              </AIMessageContent>

              {message.role === "assistant" && (
                <DiceBearAvatar
                  seed="assistant"
                  imageUrl="/vivia-logo.png"
                  imageClassName="object-contain p-1"
                />
              )}
            </AIMessage>
          ))}
        </AIConversationContent>
      </AIConversation>
      {/*Loading Suggestions*/}
      {toUIMessages(messages.results ?? []).length === 1 && (
        <AISuggestions className="flex w-full flex-col items-end p-2">
          {suggestions.map((suggestion) => {
            if (!suggestion) {
              return null

            }
            return (
              <AISuggestion
                key={suggestion}
                onClick={() => {
                  form.setValue("message", suggestion, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                  form.handleSubmit(onSubmit)();
                }}
                suggestion={suggestion}
              />
            )
          }

          )}
        </AISuggestions>
      )}

      <Form {...form}>
        <AIInput
          onSubmit={form.handleSubmit(onSubmit)}
          className="rounded-none border-x-0 border-b-0"
        >
          <FormField
            control={form.control}
            disabled={conversation?.status === "resolved"}
            name="message"
            render={({ field }) => (
              <AIInputTextarea
                {...field}
                placeholder={
                  conversation?.status === "resolved"
                    ? "This conversation has been resolved"
                    : "Type your message..."
                }
                disabled={conversation?.status === "resolved"}
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
            <AIInputTools>
              <AIInputSubmit
                disabled={!form.formState.isValid || conversation?.status === "resolved"}
                status="ready"
                type="submit"
              />
            </AIInputTools>
          </AIInputToolbar>
        </AIInput>
      </Form>
    </>
  );
};