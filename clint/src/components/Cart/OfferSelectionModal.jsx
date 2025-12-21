import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaCheck, FaTimes } from 'react-icons/fa';

const OfferSelectionModal = ({ offer, onApply, onClose }) => {
    const [selectedOption, setSelectedOption] = useState('');

    if (!offer) return null;

    const handleApply = () => {
        if (!selectedOption) return;
        onApply(selectedOption);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <FaGift className="text-2xl text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Choose 1 Free Gift!</h3>
                                <p className="text-white/80 text-sm">You unlocked a special offer for ordering over ₹{offer.minOrderValue}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="space-y-3">
                            {offer.options.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedOption === option
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-gray-100 bg-gray-50 hover:border-emerald-200'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedOption === option
                                            ? 'border-emerald-500 bg-emerald-500'
                                            : 'border-gray-300'
                                        }`}>
                                        {selectedOption === option && <FaCheck className="text-white text-xs" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="giftOption"
                                        className="hidden"
                                        value={option}
                                        checked={selectedOption === option}
                                        onChange={(e) => setSelectedOption(e.target.value)}
                                    />
                                    <span className={`font-medium ${selectedOption === option ? 'text-emerald-900' : 'text-gray-700'}`}>
                                        {option}
                                    </span>
                                </label>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Not Now
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!selectedOption}
                                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-white ${selectedOption
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                        : 'bg-gray-300 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                Apply Gift
                            </button>
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-4 text-center">
                        <p className="text-xs text-emerald-700 font-medium">Selected gift will be added to your order instructions</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OfferSelectionModal;
