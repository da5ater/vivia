"use client";

import { useVapi } from "@/modules/widget/hooks/use-vapi";
import { Button } from "@workspace/ui/components/button";

export default function Page() {
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    transcript,
    startCall,
    endCall,
  } = useVapi();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh max-w-md mx-auto w-full">
      <h1>Vapi Test</h1>

      {/* Control Buttons */}
      {!isConnected && !isConnecting ? (
        <Button onClick={startCall} variant="destructive">
          Start Call
        </Button>
      ) : (
        <Button onClick={endCall}>End Call</Button>
      )}

      {/* Status Indicators */}
      <div className="mt-4">
        <p>{isSpeaking ? "Speaking..." : ""}</p>
        <p>{isConnecting ? "Connecting..." : ""}</p>
        <p>{isConnected ? "Connected" : ""}</p>
      </div>

      {/* Transcript Display */}
      <div className="mt-6 w-full bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
        <h2 className="text-black font-bold mb-2">Transcript:</h2>
        {transcript.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet...</p>
        ) : (
          <div className="space-y-2">
            {transcript.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${
                  msg.role === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-green-100 text-green-900"
                }`}
              >
                <span className="font-semibold text-xs uppercase">
                  {msg.role}:
                </span>{" "}
                <span className="text-sm">{msg.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
