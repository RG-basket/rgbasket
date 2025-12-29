import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, CheckCircle2, MessageSquare, ShieldCheck, Zap, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const PhoneCollectionPopup = () => {
    const { user, isLoggedIn, updateUserProfile } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [stage, setStage] = useState('initial'); // 'initial', 'rethinking'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if we should show the popup
        const dismissalData = localStorage.getItem('phone_popup_last_dismissed');
        let shouldHide = false;

        if (dismissalData) {
            const lastDismissed = parseInt(dismissalData);
            const now = Date.now();
            const hours24 = 24 * 60 * 60 * 1000;

            if (now - lastDismissed < hours24) {
                shouldHide = true;
            }
        }

        // Only show if logged in, has no phone, and hasn't dismissed it in the last 24h
        if (isLoggedIn && user && !user.phone && !shouldHide) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 3000);
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
                toast.success("Welcome to the Priority Circle! ✨");
                setIsOpen(false);
            } else {
                toast.error(result.message || "Failed to update number");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAttempt = () => {
        if (stage === 'initial') {
            setStage('rethinking');
        } else {
            // Respect refusal for 24 hours
            localStorage.setItem('phone_popup_last_dismissed', Date.now().toString());
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-100"
                >
                    <button
                        onClick={handleCloseAttempt}
                        className="absolute top-6 right-6 p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-all z-10"
                    >
                        <X size={18} />
                    </button>

                    {stage === 'initial' ? (
                        <div className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                    <Sparkles size={32} />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Priority Member Access</h2>
                                <p className="text-sm text-gray-500 leading-relaxed px-1 font-medium">
                                    Join our priority inner circle to get the best of RGBasket before everyone else.
                                </p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <InfoRow icon={<Zap size={16} className="text-amber-500" />} text="Early Fresh-Stock Alerts" />
                                <InfoRow icon={<MessageSquare size={16} className="text-blue-500" />} text="Personal Shopping Concierge" />
                                <InfoRow icon={<ShieldCheck size={16} className="text-emerald-500" />} text="Seamless One-Click Support" />
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold group-focus-within:text-emerald-500 transition-colors">+91</span>
                                    <input
                                        type="tel"
                                        placeholder="WhatsApp Number"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-base font-semibold tracking-wide"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || phoneNumber.length < 10}
                                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${loading || phoneNumber.length < 10
                                        ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                                        : 'bg-gray-900 hover:bg-black active:scale-[0.98] shadow-gray-200'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>Complete My Profile <ArrowRight size={18} /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
                                    <AlertCircle size={32} />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-xl font-extrabold text-gray-900 mb-2">Wait! Stay Connected? 🛡️</h2>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                    Our best stocks (Organic & Seasonal) often sell out in minutes. Without alerts, you'll have to check the site manually.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3 mb-8">
                                <p className="text-xs text-gray-600 font-bold flex gap-3">
                                    <span className="text-red-400">•</span>
                                    <span>Miss out on "Fresh Arrival" notifications.</span>
                                </p>
                                <p className="text-xs text-gray-600 font-bold flex gap-3">
                                    <span className="text-red-400">•</span>
                                    <span>No direct line to our personal shopping team.</span>
                                </p>
                                <p className="text-xs text-gray-600 font-bold flex gap-3">
                                    <span className="text-red-400">•</span>
                                    <span>Slower support during peak order hours.</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setStage('initial')}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
                                >
                                    Okay, Link My WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.setItem('phone_popup_last_dismissed', Date.now().toString());
                                        setIsOpen(false);
                                    }}
                                    className="w-full py-2 text-gray-400 hover:text-gray-600 font-bold text-xs transition-colors tracking-tight"
                                >
                                    I'll manage everything manually
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const InfoRow = ({ icon, text }) => (
    <div className="flex items-center gap-4 group">
        <div className="w-10 h-10 rounded-xl bg-gray-50/80 flex items-center justify-center transition-transform group-hover:scale-110 border border-gray-100 shadow-sm">
            {icon}
        </div>
        <p className="text-sm font-bold text-gray-700">{text}</p>
        <CheckCircle2 size={14} className="ml-auto text-emerald-500/30" />
    </div>
);

export default PhoneCollectionPopup;
