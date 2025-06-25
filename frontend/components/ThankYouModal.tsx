import { motion } from "framer-motion";
import { Button } from "./ui/button";

interface ThankYouModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ThankYouModal({ isOpen, onClose }: ThankYouModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl border border-white/10 max-w-md w-full mx-4"
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                >
                    <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                        Thank You!
                    </h2>
                    <p className="text-slate-300 mb-6">
                        Thank you for participating in the feedback session. Your insights are valuable to us.
                    </p>
                    <Button
                        onClick={onClose}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                     text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg
                     hover:shadow-blue-500/20 hover:shadow-2xl"
                    >
                        Continue to Summary
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
} 