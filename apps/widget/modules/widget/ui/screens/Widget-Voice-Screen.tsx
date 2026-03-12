"use client";

import { ArrowLeftIcon, MicIcon, MicOffIcon, BotIcon, UserIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useSetAtom } from "jotai";
import { widgetScreenAtom } from "../../atoms/widget-atoms";
import { WidgetHeader } from "../components/widget-header";
import { WidgetFooter } from "../components/widget-footer";
import { useVapi } from "../../hooks/use-vapi";
import { cn } from "@workspace/ui/lib/utils";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";
import { useEffect, useRef, useState } from "react";

// ── Typing indicator (three bouncing dots) ──────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
      />
    ))}
  </div>
);

// ── Waveform bars (shown while assistant is speaking) ───────────────────────
const SpeakingWaveform = () => (
  <div className="flex items-center gap-[3px] px-3 py-2">
    {[0, 1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className="w-[3px] rounded-full bg-primary/70 animate-pulse"
        style={{
          height: `${8 + (i % 3) * 5}px`,
          animationDelay: `${i * 0.12}s`,
          animationDuration: "0.7s",
        }}
      />
    ))}
  </div>
);

// ── Elapsed call timer ───────────────────────────────────────────────────────
const useCallTimer = (isConnected: boolean) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isConnected) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSeconds(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isConnected]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

// ── Empty/idle state ─────────────────────────────────────────────────────────
const VoiceIdleState = ({
  isConnected,
  isConnecting,
  isSpeaking,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
}) => {
  const label = isConnecting
    ? "Connecting…"
    : isConnected
      ? isSpeaking
        ? "Assistant is speaking…"
        : "Listening…"
      : "Start a call to begin";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
      {/* Pulse rings */}
      <div className="relative flex items-center justify-center">
        {isConnected && (
          <>
            <span className="absolute size-16 rounded-full bg-primary/10 animate-ping" />
            <span className="absolute size-12 rounded-full bg-primary/15 animate-ping [animation-delay:0.2s]" />
          </>
        )}
        <div
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full border-2 transition-all duration-300",
            isConnected
              ? "border-primary bg-primary/10"
              : "border-border bg-muted"
          )}
        >
          <MicIcon
            className={cn(
              "size-6 transition-colors",
              isConnected ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
      </div>

      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
};

// ── Individual message bubble ────────────────────────────────────────────────
interface BubbleProps {
  role: "user" | "assistant";
  text: string;
  isFirst: boolean;  // first in a consecutive group?
  isLast: boolean;   // last in a consecutive group?
  isStreaming?: boolean; // currently being streamed / spoken?
  isSpeakingNow?: boolean;
}

const MessageBubble = ({
  role,
  text,
  isFirst,
  isLast,
  isStreaming,
  isSpeakingNow,
}: BubbleProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        isFirst ? "mt-3" : "mt-0.5"
      )}
    >
      {/* Avatar — only shown for the last message in a group */}
      <div className="flex size-6 shrink-0 items-end justify-center">
        {isLast ? (
          <div
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[10px]",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground border border-border"
            )}
          >
            {isUser ? (
              <UserIcon className="size-3" />
            ) : (
              <BotIcon className="size-3" />
            )}
          </div>
        ) : null}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed transition-all",
          // shape: flatten the corner nearest to where the avatar sits
          isUser
            ? [
                "bg-primary text-primary-foreground",
                isLast ? "rounded-br-sm" : "",
              ]
            : [
                "bg-muted text-foreground border border-border",
                isLast ? "rounded-bl-sm" : "",
              ],
          // subtle glow while streaming
          isStreaming && !isUser
            ? "ring-1 ring-primary/30 shadow-sm shadow-primary/10"
            : ""
        )}
      >
        {/* Role label only on first bubble of a group */}
        {isFirst && (
          <p
            className={cn(
              "mb-1 text-[10px] font-semibold uppercase tracking-wide",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground/80"
            )}
          >
            {isUser ? "You" : "Assistant"}
          </p>
        )}

        <p className="whitespace-pre-wrap break-words">{text}</p>

        {/* Live speaking indicator appended to the last assistant bubble */}
        {isSpeakingNow && !isUser && <SpeakingWaveform />}
      </div>
    </div>
  );
};

// ── Main screen ──────────────────────────────────────────────────────────────
export const WidgetVoiceScreen = () => {
  const setScreen = useSetAtom(widgetScreenAtom);

  const {
    isConnected,
    isSpeaking,
    transcript,
    startCall,
    endCall,
    isConnecting,
  } = useVapi();

  const callTimer = useCallTimer(isConnected);

  const handleBack = async () => {
    if (isConnected || isConnecting) {
      await endCall();
    }
    setScreen("selection");
  };

  // Annotate each message: is it the first/last in its role group?
  const annotated = transcript.map((msg, i) => {
    const prev = transcript[i - 1];
    const next = transcript[i + 1];
    const isFirst = !prev || prev.role !== msg.role;
    const isLast = !next || next.role !== msg.role;
    const isLastOverall = i === transcript.length - 1;
    return { ...msg, isFirst, isLast, isLastOverall };
  });

  return (
    <>
      <WidgetHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={isConnecting}
          >
            <ArrowLeftIcon className="size-5" />
          </Button>

          <div className="flex flex-col leading-tight">
            <p className="text-sm font-semibold">Voice Chat</p>
            {isConnected && (
              <p className="text-xs tabular-nums text-muted-foreground">
                {callTimer}
              </p>
            )}
          </div>
        </div>
      </WidgetHeader>

      {transcript.length > 0 ? (
        <AIConversation className="flex-1 overflow-hidden">
          <AIConversationContent className="px-3 pb-4 pt-2">
            {annotated.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}-${message.text.slice(0, 20)}`}
                role={message.role}
                text={message.text}
                isFirst={message.isFirst}
                isLast={message.isLast}
                // The very last assistant message glows while streaming
                isStreaming={
                  message.isLastOverall &&
                  message.role === "assistant" &&
                  (isConnected || isConnecting)
                }
                // Show waveform only on last assistant bubble while speaking
                isSpeakingNow={
                  message.isLastOverall &&
                  message.role === "assistant" &&
                  isSpeaking
                }
              />
            ))}

            {/* Show typing indicator when assistant hasn't responded yet */}
            {isConnected && !isSpeaking && transcript.length > 0 && transcript[transcript.length - 1]?.role === "user" && (
              <div className="mt-3 flex items-end gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                  <BotIcon className="size-3 text-muted-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-border bg-muted">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </AIConversationContent>

          <AIConversationScrollButton />
        </AIConversation>
      ) : (
        <VoiceIdleState
          isConnected={isConnected}
          isConnecting={isConnecting}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Status bar + action button */}
      <div className="border-t bg-background p-3">
        {(isConnected || isConnecting) && (
          <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div
              className={cn(
                "size-2.5 rounded-full transition-colors",
                isConnecting
                  ? "animate-pulse bg-yellow-500"
                  : isSpeaking
                    ? "animate-pulse bg-blue-500"
                    : "bg-green-500"
              )}
            />
            <span>
              {isConnecting
                ? "Connecting…"
                : isSpeaking
                  ? "Assistant speaking…"
                  : "Listening to you…"}
            </span>
          </div>
        )}

        <div className="flex w-full justify-center">
          {isConnected ? (
            <Button
              className="w-full"
              disabled={isConnecting}
              variant="destructive"
              size="lg"
              onClick={endCall}
            >
              <MicOffIcon className="size-5" />
              <span>End Call</span>
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={isConnecting}
              variant="outline"
              size="lg"
              onClick={startCall}
            >
              <MicIcon className="size-5" />
              <span>{isConnecting ? "Connecting…" : "Start Call"}</span>
            </Button>
          )}
        </div>
      </div>

      <WidgetFooter />
    </>
  );
};