import useCombinedTranscriptions from "@/hooks/useCombinedTranscriptions";
import * as React from "react";

export default function TranscriptionView() {
  const combinedTranscriptions = useCombinedTranscriptions();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when new transcription is added
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [combinedTranscriptions]);

  // Group consecutive messages by role
  const groupedMessages = [];
  let currentGroup: { role: string; texts: string[]; id: string } | null = null;

  for (const segment of combinedTranscriptions) {
    if (!currentGroup || currentGroup.role !== segment.role) {
      if (currentGroup) groupedMessages.push(currentGroup);
      currentGroup = { role: segment.role, texts: [segment.text], id: segment.id };
    } else {
      currentGroup.texts.push(segment.text);
    }
  }
  if (currentGroup) groupedMessages.push(currentGroup);
  console.log("Grouped Messages:", groupedMessages);

  return (
    <div className="relative w-full max-w-[90vw] mx-auto border border-gray-700 rounded-lg bg-gray-900 shadow-lg flex flex-col h-full">
      <div className="h-full flex flex-col gap-4 text-black overflow-y-auto px-4 py-8">
        {groupedMessages.map((group, index) => {
          const isAssistant = group.role === "assistant";
          const emoji = isAssistant ? "🤖" : "🧑";

          return (
            <div
              key={`${group.id}-${index}`}
              className={`flex items-start gap-3 ${isAssistant ? "self-start flex-row" : "self-end flex-row-reverse"}`}
            >
              {/* Avatar circle with emoji */}
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                {emoji}
              </div>

              {/* Chat bubble */}
              <div
                className={`p-3 rounded-2xl text-white max-w-[75%] whitespace-pre-line ${isAssistant ? "bg-blue-600" : "bg-gray-800"
                  }`}
              >
                {group.texts.map((text, i) => (
                  <p key={i} className="leading-relaxed">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
