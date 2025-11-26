import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { serviceablePincodes } from '../../assets/assets.js';
import { motion, AnimatePresence } from 'framer-motion';

const PincodeSchema = z.string().regex(/^\d{6}$/, {
  message: 'Please enter a valid 6-digit pincode.',
});

// Animation variants
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.3
    }
  }
};

const inputVariants = {
  focus: {
    scale: 1.02,
    boxShadow: "0 0 0 3px rgba(0, 85, 49, 0.1)",
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.95
  }
};

const resultVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  })
};

export default function ServiceabilityModal({ onClose }) {
  const [pincode, setPincode] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [status, setStatus] = useState(null);
  const [matchedAreas, setMatchedAreas] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    // Check if we should show the modal based on current path
    const currentPath = window.location.pathname;
    const allowedPaths = ['/', '/home', '/products', '/category'];
    const isAllowedPath = allowedPaths.some(path => currentPath === path || currentPath.startsWith('/products/'));
    
    if (!isAllowedPath) {
      onClose();
      return;
    }

    const saved = localStorage.getItem('userPincode');
    if (saved && PincodeSchema.safeParse(saved).success) {
      const isServiced = serviceablePincodes.some(entry => entry.pincode === saved);
      if (isServiced) {
        onClose();
        return;
      }
    }
    
    setShouldShowModal(true);
  }, [onClose]);

  useEffect(() => {
    const saved = localStorage.getItem('userPincode');
    if (saved && PincodeSchema.safeParse(saved).success) {
      setPlaceholder(saved);
    }
  }, []);

  const checkServiceability = async () => {
    setIsChecking(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = PincodeSchema.safeParse(pincode);
    if (!result.success) {
      setStatus('invalid');
      setMatchedAreas([]);
      setIsChecking(false);
      return;
    }

    const matches = serviceablePincodes.filter(entry => entry.pincode === pincode);
    if (matches.length > 0) {
      localStorage.setItem('userPincode', pincode);
      setMatchedAreas(matches);
      setStatus('serving');
      setTimeout(() => {
        setIsChecking(false);
        setTimeout(() => onClose(), 1000);
      }, 1000);
    } else {
      setStatus('not-serving');
      setMatchedAreas([]);
      setIsChecking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      checkServiceability();
    }
  };

  // Don't render modal if it shouldn't be shown
  if (!shouldShowModal) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-gradient-to-br from-white to-gray-50/80 border-2 border-[#005531]/20 rounded-2xl p-8 w-full max-w-md text-center shadow-2xl relative overflow-hidden"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decorative elements */}
        <motion.div 
          className="absolute -top-20 -right-20 w-40 h-40 bg-[#005531]/5 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#005531]/5 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-[#005531] to-[#00855a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-2xl">📍</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Service Availability</h2>
          <p className="text-gray-600 mb-6">Enter your pincode to see if we deliver to your area</p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder={placeholder || "Enter 6-digit pincode"}
            value={pincode}
            onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#005531] text-lg font-medium bg-white/80 backdrop-blur-sm"
            whileFocus="focus"
            variants={inputVariants}
          />

          <motion.button
            onClick={checkServiceability}
            disabled={isChecking}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="mt-6 w-full bg-gradient-to-r from-[#005531] to-[#00855a] text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isChecking ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Checking...
              </>
            ) : (
              <>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🔍
                </motion.span>
                Check Availability
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {status === 'serving' && matchedAreas.length > 0 && (
            <motion.div 
              className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl"
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: 3,
                  ease: "easeInOut"
                }}
              >
                <span className="text-xl">✅</span>
              </motion.div>
              <h3 className="text-green-800 font-bold text-lg mb-3">We're serving your area! 🎉</h3>
              <div className="text-left text-gray-700 space-y-2">
                <p><strong>📍 Pincode:</strong> {pincode}</p>
                <p><strong>🏙️ City:</strong> {matchedAreas[0].city}</p>
                <p><strong>📦 Serviceable Areas:</strong></p>
                <ul className="space-y-1 ml-4">
                  {matchedAreas.map((entry, index) => (
                    <motion.li 
                      key={index}
                      custom={index}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex items-center gap-2"
                    >
                      <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        🚚
                      </motion.span>
                      {entry.area}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {status === 'not-serving' && (
            <motion.div 
              className="mt-6 p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl"
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-3xl">😔</span>
              </motion.div>
              <h3 className="text-red-700 font-bold text-lg mt-2">Not Serving This Area Yet</h3>
              <p className="text-red-600 mt-2">We're expanding quickly! Check back soon.</p>
            </motion.div>
          )}

          {status === 'invalid' && (
            <motion.div 
              className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl"
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  ⚠️
                </motion.span>
                <p className="text-yellow-700 font-medium">Please enter a valid 6-digit pincode</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample Serviceable Pincodes */}
        <motion.div 
          className="mt-8 text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p 
            className="font-semibold text-gray-700 mb-3 flex items-center gap-2"
            whileHover={{ x: 5 }}
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              🌟
            </motion.span>
            Currently Serving These Areas:
          </motion.p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {serviceablePincodes.slice(0, 5).map((entry, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-3 p-2 bg-white/50 rounded-lg border border-gray-200/50"
                custom={index}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(0, 85, 49, 0.05)"
                }}
              >
                <span className="text-sm font-mono text-[#005531] bg-[#005531]/10 px-2 py-1 rounded">
                  {entry.pincode}
                </span>
                <span className="text-sm text-gray-600">
                  {entry.area}, {entry.city}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
export { ServiceabilityModal };