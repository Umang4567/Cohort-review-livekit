import { useEffect, useRef } from "react";
import useCombinedTranscriptions, { Message } from "@/hooks/useCombinedTranscriptions";

interface Props {
  onMessagesUpdate?: (messages: Message[]) => void;
}

export default function TranscriptionView({ onMessagesUpdate }: Props) {
  const { groupedMessages } = useCombinedTranscriptions();
  const bottomRef = useRef<HTMLDivElement>(null);

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
    <div className="space-y-4">
      {groupedMessages.map((message: Message, index: number) => (
        <div
          key={index}
          className={`p-3 rounded-lg ${message.role === "assistant"
            ? "bg-black/30 border border-white/5 mr-20"
            : "bg-blue-500/10 border border-blue-500/20 ml-20"
            }`}
        >
          <p className="text-sm font-fira mb-1 text-slate-400">
            {message.role === "assistant" ? "Assistant" : "You"}
          </p>
          <p className="text-white text-sm">{message.content}</p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
