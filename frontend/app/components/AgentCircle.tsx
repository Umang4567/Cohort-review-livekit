'use client'

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AgentCircleProps {
    isActive: boolean;
}

export default function AgentCircle({ isActive }: AgentCircleProps) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                setScale(prev => prev === 1 ? 1.1 : 1);
            }, 500);
            return () => clearInterval(interval);
        } else {
            setScale(1);
        }
    }, [isActive]);

    return (
        <div className="relative w-12 h-12">
            {/* Outer glow */}
            <motion.div
                animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                    opacity: isActive ? [0.5, 0.8, 0.5] : 0.5
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-blue-500/30 blur-md"
            />

            {/* Main circle */}
            <motion.div
                animate={{ scale }}
                className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg border border-white/10"
            >
                <motion.div
                    animate={{
                        scale: isActive ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="text-white text-xl"
                >
                    🤖
                </motion.div>
            </motion.div>

            {/* Ripple effect when active */}
            {isActive && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                />
            )}
        </div>
    );
} 