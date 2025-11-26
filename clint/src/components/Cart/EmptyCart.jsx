import React from 'react';
import { motion } from 'framer-motion';

const EmptyCart = ({ navigate }) => {
    return (
        <motion.div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-green-100 p-6 sm:p-8 text-center relative overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.6,
                        ease: "easeOut"
                    }
                }
            }}
        >
            <motion.div
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                }}
            >
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </motion.div>

            <motion.h2
                className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                Your cart is empty
            </motion.h2>

            <motion.p
                className="text-gray-600 mb-6 text-sm sm:text-base relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                Add some fresh groceries to get started with your order
            </motion.p>

            <motion.button
                onClick={() => navigate('/products/all')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
            >
                Start Shopping
            </motion.button>
        </motion.div>
    );
};

export default EmptyCart;
