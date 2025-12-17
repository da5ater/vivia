"use client";

import { useMutation, useQuery } from "convex/react";
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

  if (!conversation) {
    return <div>... Loading</div>;
  }

  return (
    <div className="flex h-full flex-col bg-muted">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background p-2.5">
        {/* Placeholder for header content */}

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="size-4" />
        </Button>
      </header>

      <AIConversation className="max-h-[calc(100vh-100px)] flex-1">
        <AIConversationContent>
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
                    form.formState.isSubmitting
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
                  <AIInputButton onClick={() => {}}>
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
