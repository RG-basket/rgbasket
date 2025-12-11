import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPopup = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    // Configuration: How many days to wait before showing popup again
    const REMINDER_DAYS = 3;
    const COOLDOWN_PERIOD = REMINDER_DAYS * 24 * 60 * 60 * 1000;

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            setDeferredPrompt(e);

            // Check timestamp of last dismissal
            const lastDismissed = localStorage.getItem('installPopupDismissedAt');
            const now = Date.now();

            // Show if never dismissed OR if cooldown period has passed
            if (!lastDismissed || (now - parseInt(lastDismissed) > COOLDOWN_PERIOD)) {
                setShowPopup(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setShowPopup(false);
        } else {
            console.log('User dismissed the install prompt');
            // If they cancel the native prompt, treat it as a "Not Now" (dismiss for 3 days)
            handleDismiss();
        }

        // We no longer need the prompt.  Clear it up.
        setDeferredPrompt(null);
        setShowPopup(false);
    };

    const handleDismiss = () => {
        setShowPopup(false);
        // Store current timestamp instead of boolean for cooldown logic
        localStorage.setItem('installPopupDismissedAt', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {showPopup && (
                <motion.div
                    className="fixed inset-0 z-[10000] flex items-center justify-center px-4 sm:px-0 bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative border border-gray-100"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        {/* Icon/Image Section */}
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#005531]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-center text-[#005531] mb-2">
                            Install RG Basket
                        </h2>
                        <p className="text-gray-500 text-center text-sm mb-6">
                            Install our app for a faster, better experience and easy access to your orders!
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleInstallClick}
                                className="w-full bg-[#005531] hover:bg-[#004024] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Install App</span>
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="w-full text-gray-400 hover:text-gray-600 font-medium py-2 text-sm transition-colors"
                            >
                                Not now
                            </button>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallPopup;
