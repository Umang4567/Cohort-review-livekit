'use client'

import { motion } from 'framer-motion'

export default function FeedbackHeader() {
    return (
        <section className="py-16 px-6 text-center absolute top-0 left-0 w-full z-10 bg-transparent">

            {/* Animated Gradient Text */}
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="text-4xl md:text-3xl font-primary font-bold text-transparent bg-clip-text bg-white"
            >
                Your <span className="font-primary bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400">Feedback</span> Matters
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="mt-4 text-lg md:text-xl text-white/70 font-primary"
            >
                Share your thoughts and help us improve our AI workshops and events
            </motion.p>

            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute top-4 left-10"
            >
                <img
                    src={"/logo.svg"}
                    alt="BuildFast Logo"
                    className="hidden dark:block"
                    width={80}
                    height={80}
                />
                {/* <button className="bg-white/10 border border-white/20 backdrop-blur-lg rounded-full p-2 hover:scale-105 transition">
                    <span role="img" aria-label="theme" className="text-white text-xl">🌙</span>
                </button> */}
            </motion.div>
            {/* Glow or light mode toggle icon - optional */}
        </section>
    )
}
