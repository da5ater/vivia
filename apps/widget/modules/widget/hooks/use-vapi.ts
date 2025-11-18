"use client";
import { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

interface TranscriptMessage {
  role: "user" | "assistant";
  text: string;
}

export const useVapi = () => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const vapiInstance = new Vapi("93f437ba-6946-485c-a074-ffed4bb32b39");
    setVapi(vapiInstance);

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

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const onError = (error: any) => {
      console.error("Vapi error:", error);
      setIsConnecting(false);
      setIsConnected(false);
      setIsSpeaking(false);
    };

    const onMessage = (message: any) => {
      console.log("Vapi message:", message);

      // Only add transcript messages (user speech or assistant responses)
      if (message.type === "transcript" && message.transcript) {
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role || "assistant",
            text: message.transcript,
          },
        ]);
      }
      // Handle assistant speech
      else if (
        message.type === "speech-update" &&
        message.role === "assistant"
      ) {
        // Update or add assistant message
        setTranscript((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "assistant" && !lastMessage.text) {
            // Update the last empty assistant message
            return [
              ...prev.slice(0, -1),
              { role: "assistant", text: message.text || "" },
            ];
          }
          return [...prev, { role: "assistant", text: message.text || "" }];
        });
      }
    };

    vapiInstance.on("call-start", onCallStart);
    vapiInstance.on("call-end", onCallEnd);
    vapiInstance.on("speech-start", onSpeechStart);
    vapiInstance.on("speech-end", onSpeechEnd);
    vapiInstance.on("error", onError);
    vapiInstance.on("message", onMessage);

    return () => {
      vapiInstance.stop();
      vapiInstance.off("call-start", onCallStart);
      vapiInstance.off("call-end", onCallEnd);
      vapiInstance.off("speech-start", onSpeechStart);
      vapiInstance.off("speech-end", onSpeechEnd);
      vapiInstance.off("error", onError);
      vapiInstance.off("message", onMessage);
    };
  }, []);

  const startCall = async () => {
    setIsConnecting(true);
    if (!vapi) return;
    try {
      await vapi?.start("5fca9bd3-c265-4af6-896a-432b2023bfaa");
    } catch (error) {
      console.error("Failed to start Vapi call:", error);
      setIsConnecting(false);
    }
  };

  const endCall = async () => {
    if (vapi) {
      await vapi.stop();
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
