"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { WidgetHeader } from "../components/widget-header";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, ArrowLeftIcon, MenuIcon } from "lucide-react";
import {
  conversationIdAtom,
  contactSessionIdAtom,
  widgetScreenAtom,
} from "../../atoms/widget-atoms";
import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";

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
  AIMessageAvatar,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";

import {
  AISuggestions,
  AISuggestion,
} from "@workspace/ui/components/ai/suggestion";

import { AIResponse } from "@workspace/ui/components/ai/response";

import { useThreadMessages, toUIMessages } from "@convex-dev/agent/react";
import z from "zod";
import { create } from "../../../../../../packages/backend/convex/public/conversations";
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
  const conversationId = useAtomValue(conversationIdAtom);
  const contactSessionId = useAtomValue(contactSessionIdAtom);
  const conversation = useQuery(
    api.public.conversations.getOne,
    conversationId && contactSessionId
      ? {
          conversationId,
          contactSessionId,
        }
      : "skip"
  );

  const setScreen = useSetAtom(widgetScreenAtom);
  const setConversationId = useSetAtom(conversationIdAtom);

  const messages = useThreadMessages(
    api.public.messages.getMany,
    conversation?.threadId && contactSessionId
      ? {
          threadId: conversation.threadId,
          contactSessionId,
        }
      : "skip",
    {
      initialNumItems: 50,
    }
  );

  const handleBackToChat = () => {
    setConversationId(null);
    setScreen("selection");
  };

  const createdMessage = useAction(api.public.messages.create);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!conversationId || !contactSessionId) return;

    form.reset();

    await createdMessage({
      threadId: conversation?.threadId!,
      contactSessionId,
      prompt: values.message,
    });
  };

  const { topElementRef, canLoadMore, isLoadingMore } = useInfiniteScroll({
    status: (messages.status.charAt(0).toLowerCase() +
      messages.status.slice(1)) as
      | "canLoadMore"
      | "loadingMore"
      | "exhausted"
      | "loadingFirstPage",
    loadMore: messages.loadMore,
    loadSize: 10,
    observerEnabled: true,
  });

  return (
    <>
      <WidgetHeader className="flex items-center justify-between ">
        <div className="flex items-center gap-x-2 ">
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
            ref={topElementRef} // Hook attaches here
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
                {/* Renders Markdown response safely */}
                <AIResponse>{message.text}</AIResponse>
              </AIMessageContent>
              {message.role === "assistant" && (
                <DiceBearAvatar
                  seed="assistant"
                  // size={32}
                  imageUrl="/vivia-logo.png" // Using app logo
                  imageClassName="object-contain p-1"
                  // badgeImageUrl="/vivia-logo.png" // Small badge
                />
              )}
            </AIMessage>
          ))}
        </AIConversationContent>
      </AIConversation>

      {/* Form Section */}
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
                {...field} //not so sure about this spread
                onChange={field.onChange}
                placeholder={
                  conversation?.status === "resolved"
                    ? "This conversation has been resolved"
                    : "Type your message..."
                }
                disabled={conversation?.status === "resolved"}
                onKeyDown={(e) => {
                  // Submit on Enter (without Shift)
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)();
                  }
                }}
                value={field.value}
              />
            )}
          />
          <AIInputToolbar>
            <AIInputTools>
              <AIInputSubmit
                disabled={
                  !form.formState.isValid || conversation?.status === "resolved"
                }
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
