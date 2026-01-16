import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const PhoneCollectionPopup = () => {
    const { user, isLoggedIn, updateUserProfile } = useAppContext();
    const [isVisible, setIsVisible] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check local storage for dismissal
        const dismissalData = localStorage.getItem('phone_banner_dismissed');
        let shouldHide = false;

        if (dismissalData) {
            const lastDismissed = parseInt(dismissalData);
            const now = Date.now();
            const hours24 = 24 * 60 * 60 * 1000;

            // Hide if dismissed within the last 24 hours
            if (now - lastDismissed < hours24) {
                shouldHide = true;
            }
        }

        // Only show if logged in, has no phone, and hasn't recently dismissed
        if (isLoggedIn && user && !user.phone && !shouldHide) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 5000); // Delay showing to let user settle in
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, user]);

    const handleSave = async (e) => {
        e?.preventDefault();

        if (!phoneNumber || phoneNumber.length < 10) {
            toast.error("Please enter a valid 10-digit number");
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserProfile(user.id || user._id, {
                phone: phoneNumber,
                name: user.name,
                email: user.email,
                photo: user.photo
            });
            if (result.success) {
                toast.success("You're on the list! 🚀");
                setIsVisible(false);
            } else {
                toast.error(result.message || "Failed to update number");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Save dismissal timestamp
        localStorage.setItem('phone_banner_dismissed', Date.now().toString());
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-[40]"
            >
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden relative">
                    {/* Header Decoration */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors z-10"
                    >
                        <X size={16} />
                    </button>

                    <div className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <MessageCircle size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-gray-900 font-bold text-base leading-tight">
                                    Get Order Updates on WhatsApp
                                </h3>
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                    Don't miss out on delivery status & exclusive fresh-stock alerts.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="relative flex items-center">
                            <div className="absolute left-3 text-gray-400 text-sm font-semibold pointer-events-none">
                                +91
                            </div>
                            <input
                                type="tel"
                                placeholder="WhatsApp Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading || phoneNumber.length < 10}
                                className={`absolute right-1.5 p-2 rounded-lg transition-all ${loading || phoneNumber.length < 10
                                        ? 'bg-gray-200 text-gray-400'
                                        : 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-95'
                                    }`}
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <ArrowRight size={16} />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PhoneCollectionPopup;

