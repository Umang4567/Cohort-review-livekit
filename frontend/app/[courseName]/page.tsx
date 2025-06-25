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
import { ThankYouModal } from "@/components/ThankYouModal";

export default function FeedbackPage() {
    const [room] = useState(new Room());
    const [userName, setUserName] = useState<string>();
    const [userEmail, setUserEmail] = useState<string>();
    const params = useParams();
    const courseName = decodeURIComponent(params.courseName as string);

    const connectToRoom = useCallback(async (name: string, email: string) => {
        const url = new URL(
            process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
            window.location.origin
        );

        url.searchParams.set("name", name);
        url.searchParams.set("email", email);
        url.searchParams.set("courseName", courseName);

        const response = await fetch(url.toString());
        const connectionDetails: ConnectionDetails = await response.json();

        await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken);
        await room.localParticipant.setMicrophoneEnabled(true);
        setUserName(name);
        setUserEmail(email);
    }, [room, courseName]);

    useEffect(() => {
        room.on(RoomEvent.MediaDevicesError, onDeviceFailure);
        return () => {
            room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
        };
    }, [room]);

    if (!userName) {
        return (
            <div className="mt-20 pt-20 flex items-center justify-center p-4 ">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <motion.h1
                            className="text-4xl font-primary mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            Welcome
                        </motion.h1>
                        <motion.p
                            className="text-slate-400 font-primary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Enter your details to start the feedback session
                        </motion.p>
                    </div>

                    <motion.form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const name = formData.get("name") as string;
                            const email = formData.get("email") as string;
                            if (name && email) connectToRoom(name, email);
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
                                         text-white placeholder-slate-500 font-primary"
                                required
                            />
                            <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl opacity-50" />
                        </div>

                        <div className="relative">
                            <input
                                type="email"
                                name="email"
                                placeholder="Your email"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg 
                                         focus:outline-none focus:border-blue-500/50 transition-all duration-300
                                         text-white placeholder-slate-500 font-primary"
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
                <FeedbackInterface courseName={courseName} userName={userName} userEmail={userEmail} />
                <RoomAudioRenderer />
            </RoomContext.Provider>
        </div>
    );
}

function FeedbackInterface({ courseName, userName, userEmail }: { courseName: string; userName: string; userEmail?: string }) {
    const { state: agentState } = useVoiceAssistant();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThankYouModalOpen, setIsThankYouModalOpen] = useState(false);

    const handleMessagesUpdate = (updatedMessages: Message[]) => {
        setMessages(updatedMessages);
    };

    const handleEndCall = async () => {
        setIsThankYouModalOpen(true);
    };

    const handleModalClose = async () => {
        try {
            // First analyze and store the conversation
            const response = await fetch('/api/analyze-conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    userName,
                    userEmail,
                    courseName
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze conversation');
            }

            const analysis = await response.json();
            // setUserName("")
            // Prepare URL with analysis
            // const encodedMessages = encodeURIComponent(JSON.stringify(messages));
            // const encodedUserName = encodeURIComponent(userName);
            // const encodedUserEmail = encodeURIComponent(userEmail || '');
            // const encodedAnalysis = encodeURIComponent(JSON.stringify(analysis));

            // router.push(
            //     `/${encodeURIComponent(courseName)}/summary?messages=${encodedMessages}&userName=${encodedUserName}&userEmail=${encodedUserEmail}&analysis=${encodedAnalysis}`
            // );
        } catch (error) {
            console.error('Error analyzing conversation:', error);
            // Still redirect to summary page even if analysis fails
            const encodedMessages = encodeURIComponent(JSON.stringify(messages));
            const encodedUserName = encodeURIComponent(userName);
            const encodedUserEmail = encodeURIComponent(userEmail || '');

            router.push(
                `/${encodeURIComponent(courseName)}/summary?messages=${encodedMessages}&userName=${encodedUserName}&userEmail=${encodedUserEmail}`
            );
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-screen max-h-screen overflow-hidden relative"
        >
            <ThankYouModal isOpen={isThankYouModalOpen} onClose={handleModalClose} />
            <TranscriptionView
                onMessagesUpdate={handleMessagesUpdate}
                courseName={courseName}
                onEndCall={handleEndCall}
            />
            <NoAgentNotification state={agentState} />
        </motion.div>
    );
}

function onDeviceFailure(error: Error) {
    console.error(error);
    alert(
        "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
    );
} 