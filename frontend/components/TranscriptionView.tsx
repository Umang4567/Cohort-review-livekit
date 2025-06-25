'use client'

import { useEffect, useRef } from "react";
import useCombinedTranscriptions, { Message } from "@/hooks/useCombinedTranscriptions";
import BotFace from "@/app/components/BotFace";
import { useVoiceAssistant, VoiceAssistantControlBar, DisconnectButton } from "@livekit/components-react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface Props {
  onMessagesUpdate?: (messages: Message[]) => void;
  courseName?: string;
  onEndCall?: () => void;
}

export default function TranscriptionView({ onMessagesUpdate, courseName, onEndCall }: Props) {
  const { groupedMessages } = useCombinedTranscriptions();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { state: agentState } = useVoiceAssistant();
  const isAgentSpeaking = agentState === 'speaking';
  const router = useRouter();

  // Scroll to bottom when new transcription is added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupedMessages]);

  useEffect(() => {
    if (onMessagesUpdate && groupedMessages.length > 0) {
      onMessagesUpdate(groupedMessages);
    }
  }, [groupedMessages, onMessagesUpdate]);

  return (
    <div className="flex justify-center items-center py-8 px-4">
      <div className="w-full max-w-3xl bg-[#0e0f23]/95 rounded-2xl overflow-hidden backdrop-blur-lg border border-white/10">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          {/* <Button
            variant="ghost"
            className="text-white/70 bg-gray-800 hover:text-white flex items-center gap-2"
          // onClick={() => router.push('/')}
          >
            <ArrowLeft size={20} />
            Back
          </Button> */}
          <div />
          <Button variant="ghost" className="text-white/70 bg-gray-800 hover:text-white">
            Can't speak? Try Text mode
          </Button>
        </div>

        <div className="flex flex-col h-full glassmorphism m-5 rounded-2xl">

          {/* Bot Face and Course Title */}
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <BotFace isActive={isAgentSpeaking} />
            <div className="text-center">
              <div className="text-white/70 text-sm mb-2">Providing feedback for:</div>
              <h1 className="text-xl font-semibold text-white">{courseName || "AI Feedback Session"}</h1>
            </div>
          </div>

          {/* Loading/Connecting State */}

          {/* Messages */}
          <div className="h-[300px] overflow-y-auto px-4 py-6 space-y-4 border border-white/10 m-5 rounded-2xl glass">
            {groupedMessages.map((message: Message, index: number) => (
              <div
                key={index}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${message.role === "assistant"
                    ? "bg-black/30 border border-white/5"
                    : "bg-blue-500/10 border border-blue-500/20"
                    }`}
                >
                  <p className="text-sm font-primary mb-1 text-slate-400">
                    {message.role === "assistant" ? "Assistant" : "You"}
                  </p>
                  <p className="text-white text-sm font-primary">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Voice Controls */}
          {groupedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-white/70">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-200"></div>
              </div>
              <div className="mt-4">Connecting...</div>
            </div>
          )}
          {groupedMessages.length !== 0 && (

            <div className="p-4 border-t border-white/10 ">
              <div className="flex justify-center items-center gap-4">
                <VoiceAssistantControlBar controls={{ leave: false }} />
                <DisconnectButton className="!bg-transparent !border-none" onClick={onEndCall}>
                  <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 bg-blue-800 text-white">
                    End Call
                  </Button>
                </DisconnectButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
