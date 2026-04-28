import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTicketAlt, FaGift, FaExclamationTriangle, FaCoins } from 'react-icons/fa';

const ExclusivityModal = ({ isOpen, onClose, onConfirm, type }) => {
    if (!isOpen) return null;

    // type can be: 'promo' (user trying to apply promo), 'gift' (trying to apply gift), 'coins' (trying to apply coins)
    
    const getTargetName = () => {
        switch(type) {
            case 'promo': return "Promo Code";
            case 'gift': return "Free Gift";
            case 'coins': return "RG Coins";
            default: return "Benefit";
        }
    };

    const getIcon = () => {
        switch(type) {
            case 'promo': return <FaTicketAlt />;
            case 'gift': return <FaGift />;
            case 'coins': return <FaCoins />;
            default: return <FaExclamationTriangle />;
        }
    };

    const targetName = getTargetName();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    <div className="p-6 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                            <FaExclamationTriangle className="text-3xl text-amber-500" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Choose One Benefit</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                            Applying this <b>{targetName}</b> will remove your current benefit. You can only enjoy one special offer (Promo, Gift, or Coins) per order.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onConfirm}
                                className="w-full py-3 px-6 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                {getIcon()}
                                Use {targetName}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 px-6 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                            >
                                Keep Current Offer
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ExclusivityModal;
