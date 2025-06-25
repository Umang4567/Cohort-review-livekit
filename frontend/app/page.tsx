"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (courseName.trim()) {
      const encodedCourseName = encodeURIComponent(courseName.trim());
      router.push(`/${encodedCourseName}`);
    }
  };

  return (
    <div className="mt-20 pt-20 flex items-center justify-center p-4">
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
            Course Feedback
          </motion.h1>
          <motion.p
            className="text-slate-400 font-fira"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Share your thoughts on the course
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="relative">
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Enter course name"
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
            Start Feedback
          </Button>
        </motion.form>

        <motion.div
          className="mt-8 text-center text-sm text-slate-500 font-fira"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your feedback helps us improve our courses
        </motion.div>
      </motion.div>
    </div>
  );
}
