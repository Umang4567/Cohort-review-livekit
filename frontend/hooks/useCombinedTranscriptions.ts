import { useTrackTranscription, useVoiceAssistant } from "@livekit/components-react";
import { useMemo } from "react";
import useLocalMicTrack from "./useLocalMicTrack";

export interface Message {
  role: string;
  content: string;
}

export default function useCombinedTranscriptions() {
  const { agentTranscriptions } = useVoiceAssistant();

  const micTrackRef = useLocalMicTrack();
  const { segments: userTranscriptions } = useTrackTranscription(micTrackRef);

  const combinedTranscriptions = useMemo(() => {
    return [
      ...agentTranscriptions.map((val) => {
        return { ...val, role: "assistant" };
      }),
      ...userTranscriptions.map((val) => {
        return { ...val, role: "user" };
      }),
    ].sort((a, b) => a.firstReceivedTime - b.firstReceivedTime);
  }, [agentTranscriptions, userTranscriptions]);

  const groupedMessages = useMemo(() => {
    const messages: Message[] = [];
    let currentGroup: { role: string; texts: string[] } | null = null;

    for (const segment of combinedTranscriptions) {
      if (!currentGroup || currentGroup.role !== segment.role) {
        if (currentGroup) {
          messages.push({
            role: currentGroup.role,
            content: currentGroup.texts.join(" "),
          });
        }
        currentGroup = { role: segment.role, texts: [segment.text] };
      } else {
        currentGroup.texts.push(segment.text);
      }
    }

    if (currentGroup) {
      messages.push({
        role: currentGroup.role,
        content: currentGroup.texts.join(" "),
      });
    }

    return messages;
  }, [combinedTranscriptions]);

  return { combinedTranscriptions, groupedMessages };
}
