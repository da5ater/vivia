"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { useAtomValue } from "jotai";
import { vapiSecretsAtom, widgetSettingsAtom } from "../atoms/widget-atoms";

interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
}

export const useVapi = () => {
  const vapiSecrets = useAtomValue(vapiSecretsAtom);
  const widgetSettings = useAtomValue(widgetSettingsAtom);

  const vapiRef = useRef<Vapi | null>(null);

  // Accumulates every sentence/chunk the assistant speaks in one turn.
  // Cleared on speech-start, committed (kept) on speech-end.
  const assistantAccumulatorRef = useRef<string>("");

  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!vapiSecrets?.publicApiKey) return;

    if (!vapiRef.current) {
      vapiRef.current = new Vapi(vapiSecrets.publicApiKey);
    }

    const vapi = vapiRef.current;

    const onCallStart = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setTranscript([]);
    };

    const onCallEnd = () => {
      setIsConnected(false);
      setIsConnecting(false);
      setIsSpeaking(false);
    };

    const onSpeechStart = () => {
      // Reset accumulator at the start of each assistant turn.
      assistantAccumulatorRef.current = "";
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      // Commit whatever was accumulated as the final assistant message.
      const fullText = assistantAccumulatorRef.current.trim();
      if (fullText) {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          // Replace the in-progress bubble (if any) with the complete text.
          if (last?.role === "assistant") {
            return [...prev.slice(0, -1), { role: "assistant", text: fullText }];
          }
          return [...prev, { role: "assistant", text: fullText }];
        });
      }
      assistantAccumulatorRef.current = "";
      setIsSpeaking(false);
    };

    const onError = (error: unknown) => {
      console.error("Vapi error raw:", error);

      try {
        console.error("Vapi error string:", JSON.stringify(error, null, 2));
      } catch {
        console.error("Vapi error could not be stringified");
      }

      setIsConnecting(false);
      setIsConnected(false);
      setIsSpeaking(false);
    };

    const onMessage = (message: any) => {
      console.log("Vapi full message:", message);

      const role =
        message?.role === "user" || message?.role === "assistant"
          ? message.role
          : null;

      if (!role) return;

      // ── 1) Final transcript messages ────────────────────────────────────
      const transcriptText =
        typeof message?.transcript === "string" ? message.transcript.trim() : "";

      if (message?.type === "transcript" && transcriptText) {
        if (role === "assistant") {
          // Append this sentence to the accumulator so the full turn builds up.
          const separator = assistantAccumulatorRef.current ? " " : "";
          assistantAccumulatorRef.current =
            assistantAccumulatorRef.current + separator + transcriptText;

          const accumulated = assistantAccumulatorRef.current;

          // Update / create the in-progress assistant bubble with full text so far.
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              if (last.text === accumulated) return prev;
              return [...prev.slice(0, -1), { role: "assistant", text: accumulated }];
            }
            return [...prev, { role: "assistant", text: accumulated }];
          });
        } else {
          // User transcripts — keep existing logic (each final utterance is its own message).
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === role && last?.text === transcriptText) return prev;
            if (last?.role === role) {
              return [...prev.slice(0, -1), { role, text: transcriptText }];
            }
            return [...prev, { role, text: transcriptText }];
          });
        }

        return;
      }

      // ── 2) Assistant streaming / speech-update ──────────────────────────
      // These events often carry only the *current sentence chunk*, NOT the full
      // turn. We append to the accumulator so nothing is lost.
      const streamingTextCandidates = [
        message?.text,
        message?.content,
        message?.message,
      ];

      const streamingText = streamingTextCandidates.find(
        (value) => typeof value === "string" && value.trim().length > 0
      )?.trim();

      if (
        role === "assistant" &&
        streamingText &&
        (message?.type === "speech-update" || message?.type === "conversation-update")
      ) {
        // Only append if this chunk isn't already the tail of the accumulator
        // (avoids double-appending the same sentence).
        if (!assistantAccumulatorRef.current.endsWith(streamingText)) {
          const separator = assistantAccumulatorRef.current ? " " : "";
          assistantAccumulatorRef.current =
            assistantAccumulatorRef.current + separator + streamingText;
        }

        const accumulated = assistantAccumulatorRef.current;

        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            if (last.text === accumulated) return prev;
            return [...prev.slice(0, -1), { role: "assistant", text: accumulated }];
          }
          return [...prev, { role: "assistant", text: accumulated }];
        });

        return;
      }

      // 3) Fallback لأي رسالة مفيدة أخرى
      const fallbackCandidates = [
        message?.transcript,
        message?.text,
        message?.content,
        message?.message,
      ];

      const fallbackText = fallbackCandidates.find(
        (value) => typeof value === "string" && value.trim().length > 0
      )?.trim();

      if (!fallbackText) return;

      setTranscript((prev) => {
        const last = prev[prev.length - 1];

        if (last?.role === role && last?.text === fallbackText) {
          return prev;
        }

        return [
          ...prev,
          {
            role,
            text: fallbackText,
          },
        ];
      });
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);
    vapi.on("message", onMessage);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
      vapi.off("message", onMessage);
    };
  }, [vapiSecrets?.publicApiKey]);

  const startCall = async () => {
    const assistantId = widgetSettings?.vapiSettings?.assistantId;

    if (!vapiRef.current || !assistantId) return;
    if (isConnecting || isConnected) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setIsConnecting(true);
      await vapiRef.current.start(assistantId);
    } catch (error) {
      console.error("Failed to start Vapi call:", error);
      setIsConnecting(false);
      setIsConnected(false);
      setIsSpeaking(false);
    }
  };

  const endCall = async () => {
    if (!vapiRef.current) return;

    try {
      await vapiRef.current.stop();
    } catch (error) {
      console.error("Failed to stop Vapi call:", error);
    } finally {
      setIsConnecting(false);
      setIsConnected(false);
      setIsSpeaking(false);
    }
  };

  return {
    startCall,
    endCall,
    transcript,
    isConnected,
    isConnecting,
    isSpeaking,
  };
};