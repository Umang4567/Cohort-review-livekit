"use client";

import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import UserInfoForm, { UserInfo } from "@/components/UserInfoForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { Mic, MicOff, Send, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";

export default function Page() {
  const [room] = useState(new Room());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const onConnectButtonClicked = useCallback(
    async (userData: UserInfo) => {
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
        window.location.origin
      );

      url.searchParams.set("name", userData.name);
      url.searchParams.set("skillLevel", userData.skillLevel);
      url.searchParams.set("courseName", userData.courseName);
      if (userData.experience) {
        url.searchParams.set("experience", userData.experience);
      }

      const response = await fetch(url.toString());
      const connectionDetailsData: ConnectionDetails = await response.json();

      await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setUserInfo(userData);
    },
    [room]
  );

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0f23] to-[#1c1d3f] text-white">
      {!userInfo ? (
        <UserInfoForm onSubmit={onConnectButtonClicked} />
      ) : (
        <RoomContext.Provider value={room}>
          <AIInterviewInterface />
          <RoomAudioRenderer />
        </RoomContext.Provider>
      )}
    </div>
  );
}

function AIInterviewInterface() {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const isRecording = agentState === "listening";
  const isConnected = agentState !== "disconnected";

  return (
    <div className="flex flex-col items-center px-6 pt-8">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold">
          Your <span className="text-blue-400">Feedback</span> Matters
        </h1>
        <p className="text-slate-300 mt-2">
          Share your thoughts and help us improve our AI workshops and events
        </p>
      </div>

      <div className="w-full max-w-4xl bg-[#1e203c] rounded-2xl shadow-lg p-6 relative">
        <div className="absolute top-4 left-4">
          <Button className="bg-blue-600 text-white hover:bg-blue-700" size="sm">
            Back to events
          </Button>
        </div>

        <div className="absolute top-4 right-4">
          <Button variant="outline" size="sm">
            Can't speak? Try Text mode
          </Button>
        </div>

        <div className="flex flex-col items-center py-6">
          <div className="w-full max-w-md">
            <BarVisualizer
              state={agentState}
              barCount={6}
              trackRef={audioTrack}
              color="white"
              className="w-full h-[64px]"
              options={{ minHeight: 60, maxHeight: 60, }}
            />
          </div>
          <p className="text-sm mt-4 text-slate-400">Providing feedback for:</p>
          <h2 className="text-lg font-semibold text-white text-center mt-1">
            {/* Vibe Marketing : Automate Your Personal Brand & Lead Generation */}
          </h2>
        </div>

        <ScrollArea className="max-h-[300px] space-y-4 px-2">
          <TranscriptionView />
        </ScrollArea>

        <div className="flex flex-col items-center mt-6 space-y-3">
          <div className="flex items-center space-x-2">
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton className="!bg-transparent !border-none">
              <Button variant="outline" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DisconnectButton>
          </div>
        </div>
      </div>

      <NoAgentNotification state={agentState} />
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
