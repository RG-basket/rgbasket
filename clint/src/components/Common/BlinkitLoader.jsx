import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BlinkitLoader = ({ isAppReady }) => {
    const [show, setShow] = useState(true);
    const emojis = ['🥦', '🍎', '🥕', '🥛', '🥚', '🍞', '🧺', '🚚', '🛒', '🍍', '🥑', '🍓', '🌽'];
    const [emojiIndex, setEmojiIndex] = useState(0);

    // Cycle emojis with a relaxed, high-end timing
    useEffect(() => {
        const interval = setInterval(() => {
            setEmojiIndex((prev) => (prev + 1) % emojis.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [emojis.length]);

    // Unified exit timing
    useEffect(() => {
        if (isAppReady) {
            const timer = setTimeout(() => {
                setShow(false);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [isAppReady]);

    // Premium Easing Constants
    const transitionBase = { duration: 0.8, ease: [0.76, 0, 0.24, 1] };
    const transitionSpring = { type: "spring", stiffness: 100, damping: 20 };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        y: "-100%",
                        transition: { duration: 1, ease: [0.85, 0, 0.15, 1] }
                    }}
                    className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Layer 1: Atmospheric Background */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                x: [0, 20, 0],
                                y: [0, -20, 0],
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[10%] -right-[5%] w-[60%] h-[60%] bg-emerald-100/40 rounded-full blur-[100px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.15, 1],
                                x: [0, -30, 0],
                                y: [0, 10, 0],
                            }}
                            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-[10%] -left-[5%] w-[60%] h-[60%] bg-lime-50/50 rounded-full blur-[100px]"
                        />
                    </div>

                    {/* Layer 2: Core Content */}
                    <div className="relative z-10 flex flex-col items-center w-full px-6">

                        {/* Animated Emoji Box */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ ...transitionSpring, delay: 0.1 }}
                            className="relative mb-8"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -6, 0],
                                    rotate: [-1, 1, -1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-28 h-28 bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(16,185,129,0.15)] border border-emerald-50/50 flex items-center justify-center text-5xl relative overflow-hidden"
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                        key={emojiIndex}
                                        initial={{ y: 50, opacity: 0, scale: 0.6, rotate: 15 }}
                                        animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ y: -50, opacity: 0, scale: 0.6, rotate: -15 }}
                                        transition={{
                                            duration: 0.7,
                                            ease: [0.34, 1.56, 0.64, 1] // Custom bouncy entrance
                                        }}
                                        className="absolute select-none"
                                    >
                                        {emojis[emojiIndex]}
                                    </motion.span>
                                </AnimatePresence>

                                {/* Internal shimmer effect */}
                                <motion.div
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                />
                            </motion.div>

                            {/* Decorative particles */}
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-200/50 rounded-full blur-sm"
                            />
                        </motion.div>

                        {/* Premium Typography */}
                        <div className="text-center">
                            <motion.h1
                                initial={{ letterSpacing: "0.2em", opacity: 0 }}
                                animate={{ letterSpacing: "-0.02em", opacity: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="flex items-center justify-center text-5xl font-[1000] tracking-tighter mb-4"
                            >
                                <span className="text-gray-900 drop-shadow-sm">RG</span>
                                <span className="text-emerald-500 italic ml-2 relative">
                                    BASKET
                                </span>
                            </motion.h1>

                            <div className="flex items-center justify-center overflow-hidden">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gray-200" />
                                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em] whitespace-nowrap">
                                        Freshness Simplified
                                    </span>
                                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gray-200" />
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Layer 3: Dynamic Progress Footer */}
                    <div className="absolute bottom-20 flex flex-col items-center pt-8">
                        <div className="w-56 h-[2px] bg-gray-50 rounded-full overflow-hidden relative">
                            {/* Background trace */}
                            <div className="absolute inset-0 bg-gray-100 opacity-50" />

                            {/* Active progress bar */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 2, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
                                className="w-full h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                            />

                            {/* Secondary pulse */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
                                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-300/30 to-transparent"
                            />
                        </div>

                        <motion.div
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mt-6 flex flex-col items-center"
                        >
                            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] mb-1">
                                Optimizing your basket
                            </p>
                            <span className="text-[8px] text-gray-300 font-medium">Please wait a moment</span>
                        </motion.div>
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className="fixed top-0 left-0 w-24 h-24 border-t border-l border-emerald-50 m-8 rounded-tl-3xl pointer-events-none opacity-50" />
                    <div className="fixed bottom-0 right-0 w-24 h-24 border-b border-r border-emerald-50 m-8 rounded-br-3xl pointer-events-none opacity-50" />

                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BlinkitLoader;
