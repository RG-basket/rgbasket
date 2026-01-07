import React from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LocationPrompt = ({ isOpen, onAccept, onDismiss, isBlocked }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                    >
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 ${isBlocked ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                {isBlocked ? <X size={32} /> : <MapPin size={32} />}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {isBlocked ? 'Location Access Blocked' : 'Enable Delivery Location?'}
                            </h3>

                            <p className="text-gray-600 text-sm mb-6 px-4">
                                {isBlocked
                                    ? "It looks like location access is blocked. Please tap the 'Lock' icon next to the website URL and 'Reset' permissions to continue."
                                    : "Allowing location access helps us find your address faster and provides more accurate delivery estimates for your fresh order."
                                }
                            </p>

                            <div className="space-y-3">
                                {!isBlocked ? (
                                    <button
                                        onClick={onAccept}
                                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Navigation size={18} />
                                        Yes, Use My Location
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all"
                                    >
                                        I've Reset it, Refresh Page
                                    </button>
                                )}

                                <button
                                    onClick={onDismiss}
                                    className="w-full py-3 text-gray-500 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    {isBlocked ? 'Close' : "Not now, I'll type it manually"}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onDismiss}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LocationPrompt;
