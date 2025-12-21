import React from 'react';
import { motion } from 'framer-motion';
import { FaGift } from 'react-icons/fa';

const OfferFloatingBubble = ({ offer, onClick }) => {
    if (!offer) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="fixed bottom-24 right-6 z-[9999] cursor-pointer"
        >
            <div className="relative group">
                {/* Ping Animation Effect */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>

                {/* Main Bubble */}
                <div className="relative flex items-center gap-3 bg-white dark:bg-gray-800 border-2 border-emerald-500 rounded-full py-2 px-4 shadow-2xl hover:shadow-emerald-500/30 transition-shadow">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white">
                        <FaGift className="text-lg" />
                    </div>
                    <div className="flex flex-col pr-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                            Free Gift
                        </span>
                        <span className="text-xs font-bold text-gray-800 dark:text-white whitespace-nowrap">
                            Tap to Select
                        </span>
                    </div>
                </div>

                {/* Badge for Threshold */}
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md">
                    ₹{offer.minOrderValue}+
                </div>
            </div>
        </motion.div>
    );
};

export default OfferFloatingBubble;
