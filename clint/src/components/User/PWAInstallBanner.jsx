import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPromo = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      // Don't clear the prompt - let users install multiple times
      // setDeferredPrompt(null);
    } else {
      // Fallback instructions - always show this if no native prompt
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        alert('To install RG Basket:\n\n1. Tap the Share icon 📤\n2. Scroll down\n3. Tap "Add to Home Screen"\n4. Tap "Add" in top right');
      } else if (isAndroid) {
        alert('To install RG Basket:\n\n1. Tap the menu (⋮) in top right\n2. Tap "Add to Home Screen" or "Install App"\n3. Confirm the installation');
      } else {
        alert('To install RG Basket, look for the install icon in your browser\'s address bar or check the browser menu for "Install RG Basket"');
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleRevive = () => {
    setIsDismissed(false);
  };

  return (
    <>
      {/* Full Promo - Shows initially */}
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full bg-gradient-to-r from-emerald-50 via-lime-50 to-white border border-gray-200 rounded-2xl p-6 my-6 shadow-sm relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 left-4 w-8 h-8 bg-green-500 rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-lime-500 rounded-full"></div>
              <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-emerald-400 rounded-full"></div>
            </div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Left Content */}
              <div className="flex items-center space-x-4 flex-1">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-green-400 to-lime-500 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg"
                >
                  📱
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">
                    Get the RG Basket App
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Install our app for faster shopping, offline browsing, and quick home screen access!
                  </p>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstallClick}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-lime-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:from-green-600 hover:to-lime-600 whitespace-nowrap"
                >
                  {deferredPrompt ? 'Install App' : 'Show Instructions'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDismiss}
                  className="px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-all duration-200"
                >
                  Maybe Later
                </motion.button>
              </div>
            </div>

            {/* Features Grid */}
            <div className="relative mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="flex flex-col items-center p-3 bg-white bg-opacity-50 rounded-lg">
                <span className="text-lg mb-1">⚡</span>
                <span className="text-xs text-gray-600 font-medium">Fast Loading</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white bg-opacity-50 rounded-lg">
                <span className="text-lg mb-1">📱</span>
                <span className="text-xs text-gray-600 font-medium">App Experience</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white bg-opacity-50 rounded-lg">
                <span className="text-lg mb-1">🔍</span>
                <span className="text-xs text-gray-600 font-medium">Offline Mode</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white bg-opacity-50 rounded-lg">
                <span className="text-lg mb-1">🎯</span>
                <span className="text-xs text-gray-600 font-medium">Quick Access</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sad Mini Version - Shows after dismissal */}
      <AnimatePresence>
        {isDismissed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-4 my-4 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              {/* Sad Content */}
              <div className="flex items-center space-x-3 flex-1">
                <motion.div
                  animate={{ 
                    scale: [1, 0.9, 1],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center text-xl text-white"
                >
                  😔
                </motion.div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-600 text-sm">
                    We're a little sad you didn't install our app...
                  </h3>
                  <p className="text-gray-500 text-xs">
                    You're missing out on the best shopping experience
                  </p>
                </div>
              </div>

              {/* Mini Action */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRevive}
                className="px-3 py-2 bg-gradient-to-r from-green-400 to-lime-400 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow transition-all duration-200"
              >
                Change Mind?
              </motion.button>
            </div>

            {/* Subtle pulsing effect to draw attention */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 border-2 border-green-200 rounded-xl pointer-events-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAInstallPromo;