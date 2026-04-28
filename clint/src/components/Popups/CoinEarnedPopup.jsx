import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const CoinEarnedPopup = ({ isOpen, onClose, amount, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm overflow-hidden bg-white rounded-3xl shadow-2xl"
        >
          {/* Decorative Background Circles */}
          <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 -ml-16 -mb-16 bg-yellow-500/10 rounded-full blur-3xl" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 transition-colors hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>

          <div className="p-8 text-center">
            {/* Animated Coin Icon */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-yellow-100 rounded-full shadow-inner"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full shadow-lg">
                <span className="text-3xl font-bold text-white">RG</span>
              </div>
            </motion.div>

            {/* Content */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-gray-800 mb-2"
            >
              Congratulations!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-black text-emerald-600 mb-4"
            >
              +{amount}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 font-medium mb-8 leading-relaxed"
            >
              {message || "RG Coins have been added to your wallet successfully."}
            </motion.p>

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all uppercase tracking-wider"
            >
              Claim Rewards
            </motion.button>
          </div>
        </motion.div>

        {/* Confetti-like elements */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: 0,
              y: 0 
            }}
            animate={{ 
              opacity: 0,
              scale: [0, 1, 0.5],
              x: (Math.random() - 0.5) * 400,
              y: (Math.random() - 0.5) * 400,
              rotate: Math.random() * 360
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`absolute w-3 h-3 rounded-sm ${
              ['bg-yellow-400', 'bg-emerald-500', 'bg-blue-400', 'bg-pink-400'][i % 4]
            }`}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default CoinEarnedPopup;
