"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SummaryData {
    sentiment: string;
    rating: number;
    keyPoints: string[];
    improvements: string[];
    testimonial: string;
    topicsOfInterest: string[];
    recommendationLikelihood: number;
}

export default function SummaryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const courseName = decodeURIComponent(params.courseName as string);
    const messages = searchParams.get('messages') ? JSON.parse(decodeURIComponent(searchParams.get('messages') as string)) : null;
    const apiCallMade = useRef(false);

    useEffect(() => {
        const generateSummary = async () => {
            if (apiCallMade.current) return;

            try {
                if (!messages) {
                    setError("No conversation data found");
                    return;
                }

                apiCallMade.current = true;

                const response = await fetch('/api/generate-summary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages,
                        courseName,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate summary');
                }

                const data = await response.json();
                setSummary(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                apiCallMade.current = false;
            }
        };

        generateSummary();
    }, [messages, courseName]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md text-center"
                >
                    <h1 className="text-3xl font-bold text-red-400 mb-4">Error</h1>
                    <p className="text-white mb-6">{error}</p>
                    <Button onClick={() => router.push('/')} className="bg-black/20 hover:bg-black/30 text-white border border-white/10">
                        Return Home
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-fira text-blue-400"
                >
                    Analyzing feedback...
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-4xl mx-auto"
            >
                <div className="flex justify-between items-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-playfair bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                    >
                        Feedback Summary
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
                    className="space-y-6"
                >
                    <div className="backdrop-blur-sm border border-white/10 bg-black/20 rounded-2xl p-6">
                        <h2 className="text-xl font-playfair text-white mb-4">{courseName}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                                <p className="text-sm text-slate-400 font-fira mb-1">Sentiment</p>
                                <p className="text-lg font-playfair capitalize text-white">{summary.sentiment}</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                                <p className="text-sm text-slate-400 font-fira mb-1">Rating</p>
                                <p className="text-lg font-playfair text-white">{summary.rating}/5</p>
                            </div>
                            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                                <p className="text-sm text-slate-400 font-fira mb-1">Recommendation</p>
                                <p className="text-lg font-playfair text-white">{summary.recommendationLikelihood}/5</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="backdrop-blur-sm border border-white/10 bg-black/20 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-playfair text-white mb-3">Key Points</h3>
                            <ul className="space-y-2">
                                {summary.keyPoints.map((point, index) => (
                                    <li key={index} className="text-slate-300 font-fira text-sm flex items-start">
                                        <span className="text-blue-400 mr-2">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="backdrop-blur-sm border border-white/10 bg-black/20 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-playfair text-white mb-3">Areas for Improvement</h3>
                            <ul className="space-y-2">
                                {summary.improvements.map((improvement, index) => (
                                    <li key={index} className="text-slate-300 font-fira text-sm flex items-start">
                                        <span className="text-purple-400 mr-2">•</span>
                                        {improvement}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="backdrop-blur-sm border border-white/10 bg-black/20 rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-playfair text-white mb-3">Topics of Interest</h3>
                        <div className="flex flex-wrap gap-2">
                            {summary.topicsOfInterest.map((topic, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 rounded-full text-sm font-fira
                                             bg-black/30 border border-white/5 text-blue-400"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="backdrop-blur-sm border border-white/10 bg-black/20 rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-playfair text-white mb-3">Testimonial</h3>
                        <blockquote className="text-slate-300 font-fira text-sm italic">
                            "{summary.testimonial}"
                        </blockquote>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
} 