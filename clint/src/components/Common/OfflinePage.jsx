import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

const FloatingItem = ({ emoji, delay, duration, left, top }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
            y: [0, -20, 0],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.5],
            rotate: [0, 10, -10, 0]
        }}
        transition={{ 
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
        style={{ left, top }}
        className="absolute text-2xl pointer-events-none select-none z-0"
    >
        {emoji}
    </motion.div>
);

const OfflinePage = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    const groceryItems = [
        { emoji: '🥕', delay: 0, duration: 6, x: '15%', y: '15%' },
        { emoji: '🥦', delay: 1, duration: 7, x: '85%', y: '20%' },
        { emoji: '🍎', delay: 2, duration: 5, x: '10%', y: '75%' },
        { emoji: '🍌', delay: 0.5, duration: 8, x: '90%', y: '80%' },
        { emoji: '🐟', delay: 1.5, duration: 6, x: '75%', y: '85%' },
        { emoji: '🍗', delay: 3, duration: 7, x: '20%', y: '85%' },
        { emoji: '🥛', delay: 2.5, duration: 5, x: '8%', y: '45%' },
        { emoji: '🧀', delay: 4, duration: 6, x: '92%', y: '40%' },
        { emoji: '🍓', delay: 1, duration: 5, x: '45%', y: '12%' },
        { emoji: '🥚', delay: 3.5, duration: 6, x: '55%', y: '8%' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center overflow-hidden"
        >
            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden -z-10">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50/50 via-white to-orange-50/50"
                />

                {/* Floating Grocery Items */}
                {groceryItems.map((item, index) => (
                    <FloatingItem 
                        key={index}
                        emoji={item.emoji}
                        delay={item.delay}
                        duration={item.duration}
                        left={item.x}
                        top={item.y}
                    />
                ))}
            </div>

            <div className="max-w-sm w-full space-y-6 relative z-10 bg-white/40 p-8 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-emerald-100/20">
                {/* Icon Container */}
                <div className="relative inline-block">
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="bg-white p-6 rounded-3xl relative shadow-xl shadow-emerald-100 border border-emerald-50"
                    >
                        <div className="relative">
                            <WifiOff className="w-12 h-12 text-emerald-500" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute -inset-4 border-2 border-dashed border-emerald-100 rounded-3xl"
                            />
                        </div>
                        
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white"
                        >
                            <AlertTriangle className="w-3 h-3" />
                        </motion.div>
                    </motion.div>
                </div>

                <div className="space-y-2">
                    <motion.h1 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-2xl font-black text-gray-900 leading-tight"
                    >
                        Internet's on Break! 🍎
                    </motion.h1>
                    <motion.p 
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-sm font-medium px-4"
                    >
                        We can't reach the store right now. Check your connection to keep shopping!
                    </motion.p>
                </div>

                {/* Status Pills */}
                <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-2"
                >
                    <div className="bg-emerald-50 text-emerald-700 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-between border border-emerald-100/50">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Network Status
                        </span>
                        <span className="opacity-60 uppercase tracking-tighter">Disconnected</span>
                    </div>
                </motion.div>

                {/* Action Button */}
                <div className="space-y-4 pt-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRetry}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:bg-emerald-700"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </motion.button>
                    
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                        RG Basket
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default OfflinePage;
