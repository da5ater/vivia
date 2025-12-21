"use client";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/InfiniteScrollTrigger";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/convex/_generated/api";
import { Id } from "@workspace/backend/convex/_generated/dataModel";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Wand2 } from "lucide-react";
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

const forSchema = z.object({
  message: z.string().min(1, "Message is required"),
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
    defaultValues: {
      message: "",
    },
  });

  const createMessage = useMutation(api.private.messages.create);

  const onSubmit = async (values: FormValues) => {
    try {
      await createMessage({
        prompt: values.message,
        conversationId: conversationId,
      });
      form.reset();
    } catch (error) {
      console.error("Failed to create message:", error);
    }
  };

  const messages = useThreadMessages(
    api.private.messages.getMany,
    { threadId: conversation?.threadId ?? "" },
    { initialNumItems: 20 }
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
      console.error("Failed to enhance response:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />;
  }

  return (
    <div className="flex h-full flex-col bg-muted">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background p-2.5">
        {/* Placeholder for header content */}

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="size-4" />
        </Button>

        {!!conversation && (
          <ConversationStatusButton
            status={conversation.status}
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
          />
        )}
      </header>

      <AIConversation className="max-h-[calc(100vh-100px)] flex-1">
        <AIConversationContent>
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
          />
          {toUIMessages(messages.results ?? [])?.map((message) => (
            <AIMessage
              key={message.id}
              // ROLE REVERSAL LOGIC:
              // If role is 'user', we view it as 'assistant' (incoming).
              // If role is 'assistant', we view it as 'user' (outgoing/ours).
              from={message.role === "user" ? "assistant" : "user"}
            >
              <AIMessageContent>
                {/* Only show Avatar for the End-User (incoming messages) */}
                {message.role === "user" && (
                  <DiceBearAvatar
                    seed={conversation?.contactSessionId || "user"}
                    size={32}
                  />
                )}
                <AIResponse>{message.text}</AIResponse>
              </AIMessageContent>
            </AIMessage>
          ))}
          <AIConversationScrollButton />
        </AIConversationContent>
      </AIConversation>

      <div className="p-2">
        <Form {...form}>
          <AIInput className="p-2" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <AIInputTextarea
                  {...field}
                  placeholder={
                    conversation?.status === "resolved"
                      ? "Conversation resolved"
                      : "Type your response as an operator..."
                  }
                  disabled={
                    conversation.status === "resolved" ||
                    form.formState.isSubmitting ||
                    isEnhancing
                  }
                  onKeyDown={(e) => {
                    // Standard Enter-to-send logic
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
            <AIInputToolbar>
              <AIInputTools>
                <div className="flex gap-2">
                  {/* Future Feature: Enhance Prompt */}
                  <AIInputButton
                    onClick={handleEnhanceResponse}
                    disabled={
                      isEnhancing ||
                      !form.formState.isValid ||
                      conversation.status === "resolved"
                    }
                  >
                    <Wand2 className="size-4 mr-2" /> Enhance
                  </AIInputButton>
                </div>
              </AIInputTools>
              <AIInputSubmit
                disabled={
                  conversation.status === "resolved" ||
                  form.formState.isSubmitting ||
                  !form.formState.isValid
                }
                status="ready"
                type="submit"
              />
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
