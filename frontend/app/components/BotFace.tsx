'use client'

import { motion } from 'framer-motion';

interface BotFaceProps {
    isActive: boolean;
}

export default function BotFace({ isActive }: BotFaceProps) {
    return (
        <div className="w-24 h-24 relative">
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                animate={{
                    scale: isActive ? [1, 1.05, 1] : 1,
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Main face circle */}
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 border border-white/10"
                animate={{
                    scale: isActive ? [1, 1.02, 1] : 1,
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Eyes */}
                <div className="absolute w-full h-full flex justify-center items-center">
                    <motion.div
                        className="flex gap-4"
                        animate={{
                            scale: isActive ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        {/* Left eye */}
                        <div className="w-2 h-2 rounded-full bg-white" />
                        {/* Right eye */}
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </motion.div>
                </div>

                {/* Mouth */}
                <motion.div
                    className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-6 h-1 bg-white rounded-full"
                    animate={isActive ? {
                        scaleY: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                    } : {}}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>

            {/* Glow effect */}
            {isActive && (
                <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </div>
    );
} 