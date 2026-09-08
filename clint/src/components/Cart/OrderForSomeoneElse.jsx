import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiUser, FiPhone, FiMapPin } from 'react-icons/fi';

const OrderForSomeoneElse = ({
    isOrderingForSomeoneElse,
    setIsOrderingForSomeoneElse,
    recipientData,
    setRecipientData,
    selectedAddress
}) => {
    const handleFieldChange = (field, value) => {
        setRecipientData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl border border-emerald-200/80 p-3.5 sm:p-4 shadow-sm">
            {/* Main Toggle */}
            <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FiGift size={16} />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                            Ordering for someone else?
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                            Deliver to family, friend, or relative
                        </p>
                    </div>
                </div>

                <input
                    type="checkbox"
                    checked={isOrderingForSomeoneElse}
                    onChange={(e) => setIsOrderingForSomeoneElse(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
            </label>

            {/* Expanded Fields */}
            <AnimatePresence>
                {isOrderingForSomeoneElse && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-3.5 mt-3 border-t border-gray-100 space-y-3">
                            {/* Receiver Name & Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Receiver Full Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="enter name here "
                                            value={recipientData.name}
                                            onChange={(e) => handleFieldChange('name', e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none font-medium text-gray-800"
                                            required
                                        />
                                        <FiUser className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Receiver Phone (10 digits) *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            placeholder="enter call number  "
                                            maxLength={10}
                                            value={recipientData.phone}
                                            onChange={(e) => handleFieldChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none font-medium text-gray-800"
                                            required
                                        />
                                        <FiPhone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                                    </div>
                                    <p className="text-[9px] text-gray-400 mt-0.5">Rider will call this number on arrival</p>
                                </div>
                            </div>

                            {/* Address Mode Selector */}
                            <div className="pt-1">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Delivery Destination Address *
                                </label>
                                
                                <div className="space-y-1.5 text-xs">
                                    {selectedAddress && (
                                        <label className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50/60 cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="addressMode"
                                                checked={recipientData.useSelectedAddress === true}
                                                onChange={() => handleFieldChange('useSelectedAddress', true)}
                                                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div className="min-w-0">
                                                <span className="font-semibold text-gray-800 text-[11px] block">
                                                    Deliver to selected saved address:
                                                </span>
                                                <span className="text-gray-500 text-[10px] truncate block">
                                                    {selectedAddress.street}, {selectedAddress.locality}, {selectedAddress.city} - {selectedAddress.pincode}
                                                </span>
                                            </div>
                                        </label>
                                    )}

                                    <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-gray-50/60 cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="addressMode"
                                            checked={recipientData.useSelectedAddress === false}
                                            onChange={() => handleFieldChange('useSelectedAddress', false)}
                                            className="text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="font-semibold text-gray-800 text-[11px]">
                                            Enter a different delivery address for receiver
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Receiver's Custom Address Fields */}
                            {!recipientData.useSelectedAddress && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 pt-1"
                                >
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                                          Enter Full Address Here 
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="enter adress here "
                                            value={recipientData.street}
                                            onChange={(e) => handleFieldChange('street', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none text-gray-800"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                                                Locality / Area *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder=" "
                                                value={recipientData.locality}
                                                onChange={(e) => handleFieldChange('locality', e.target.value)}
                                                className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none text-gray-800"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                                                Pincode (6 digits) *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder=" "
                                                maxLength={6}
                                                value={recipientData.pincode}
                                                onChange={(e) => handleFieldChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none text-gray-800"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                                            Landmark (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder=" nearby location here "
                                            value={recipientData.landmark}
                                            onChange={(e) => handleFieldChange('landmark', e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 outline-none text-gray-800"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderForSomeoneElse;
