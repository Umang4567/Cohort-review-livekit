"use client";

import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
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
import { Room, RoomEvent } from "livekit-client";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ConnectionDetails } from "../api/connection-details/route";
import type { Message } from "@/hooks/useCombinedTranscriptions";

export default function FeedbackPage() {
    const params = useParams();
    const router = useRouter();
    const courseName = decodeURIComponent(params.courseName as string);
    const [room] = useState(new Room());
    const [userName, setUserName] = useState<string>("");

    const connectToRoom = useCallback(
        async (name: string) => {
            const url = new URL(
                process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
                window.location.origin
            );

            url.searchParams.set("name", name);
            url.searchParams.set("courseName", courseName);

            const response = await fetch(url.toString());
            const connectionDetailsData: ConnectionDetails = await response.json();

            await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
            await room.localParticipant.setMicrophoneEnabled(true);
            setUserName(name);
        },
        [room, courseName]
    );

    useEffect(() => {
        room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
        return () => {
            room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
        };
    }, [room]);

    if (!userName) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <motion.h1
                            className="text-4xl font-playfair mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            Welcome
                        </motion.h1>
                        <motion.p
                            className="text-slate-400 font-fira"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Enter your name to start the feedback session
                        </motion.p>
                    </div>

                    <motion.form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const name = formData.get("name") as string;
                            if (name) connectToRoom(name);
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        <div className="relative">
                            <input
                                type="text"
                                name="name"
                                placeholder="Your name"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg 
                                         focus:outline-none focus:border-blue-500/50 transition-all duration-300
                                         text-white placeholder-slate-500 font-fira"
                                required
                            />
                            <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl opacity-50" />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                                     text-white font-medium py-3 rounded-lg transition-all duration-300 shadow-lg
                                     hover:shadow-blue-500/20 hover:shadow-2xl"
                        >
                            Start Session
                        </Button>
                    </motion.form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <RoomContext.Provider value={room}>
                <FeedbackInterface courseName={courseName} userName={userName} />
                <RoomAudioRenderer />
            </RoomContext.Provider>
        </div>
    );
}

function FeedbackInterface({ courseName, userName }: { courseName: string; userName: string }) {
    const { state: agentState, audioTrack } = useVoiceAssistant();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);

    const handleMessagesUpdate = (updatedMessages: Message[]) => {
        setMessages(updatedMessages);
    };

    const handleEndCall = () => {
        const encodedMessages = encodeURIComponent(JSON.stringify(messages));
        router.push(`/${encodeURIComponent(courseName)}/summary?messages=${encodedMessages}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen p-4 md:p-8"
        >
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-playfair bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                    >
                        Feedback Session
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            onClick={() => router.push('/')}
                            className="bg-black/20 hover:bg-black/30 text-white border border-white/10"
                        >
                            Exit
                        </Button>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-white/10 bg-black/20"
                >
                    <div className="p-6">
                        <div className="mb-6">
                            <p className="text-sm text-slate-400 mb-1 font-fira">Course</p>
                            <h2 className="text-xl font-playfair text-white">{courseName}</h2>
                        </div>

                        <div className="w-full max-w-md mx-auto mb-8">
                            <BarVisualizer
                                state={agentState}
                                barCount={32}
                                trackRef={audioTrack}
                                color="#60a5fa"
                                className="w-full h-[40px]"
                                options={{ minHeight: 2, maxHeight: 40 }}
                            />
                        </div>

                        <ScrollArea className="h-[300px] rounded-lg border border-white/5 bg-black/30 p-4">
                            <TranscriptionView onMessagesUpdate={handleMessagesUpdate} />
                        </ScrollArea>

                        <div className="flex justify-center mt-6 space-x-4">
                            <DisconnectButton className="!bg-transparent !border-none" onClick={handleEndCall}>
                                <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 bg-blue-500 text-white">
                                    End Call
                                </Button>
                            </DisconnectButton>
                        </div>
                    </div>
                </motion.div>

                <NoAgentNotification state={agentState} />
            </div>
        </motion.div>
    );
}

function onDeviceFailure(error: Error) {
    console.error(error);
    alert(
        "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
    );
} 