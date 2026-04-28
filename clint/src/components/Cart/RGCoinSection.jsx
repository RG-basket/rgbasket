import React, { useState, useEffect } from 'react';
import { FaCoins } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

const RGCoinSection = ({
    userCoins = 0,
    coinsUsed = 0,
    coinDiscount = 0,
    onToggle,
    currencySymbol = '₹',
    totalBeforeCoins = 0
}) => {
    const { rewardSettings } = useAppContext();
    const { 
        conversionRate = 10, 
        maxRedemptionRupees = 30,
        minOrderForRedemption = 0
    } = rewardSettings;

    const isBelowThreshold = totalBeforeCoins < minOrderForRedemption;
    const maxRedemptionCoins = maxRedemptionRupees * conversionRate;
    const maxCoinsByCartTotal = Math.floor(Math.max(0, totalBeforeCoins) * conversionRate);

    const [sliderValue, setSliderValue] = useState(coinsUsed || 0);
    const maxSelectable = Math.min(userCoins, maxRedemptionCoins, maxCoinsByCartTotal);

    useEffect(() => {
        // If order total falls below threshold while coins are applied, remove them
        if (isBelowThreshold && coinsUsed > 0) {
            onToggle(0);
        }
        
        // If the cart total decreases and slider is now above maxSelectable, auto-adjust
        if (sliderValue > maxSelectable) {
            setSliderValue(maxSelectable);
        }
    }, [maxSelectable, isBelowThreshold, coinsUsed]);

    useEffect(() => {
        setSliderValue(coinsUsed || 0);
    }, [coinsUsed]);

    // SECURITY/UX: If user has less than the conversion rate (e.g. 10 coins), 
    // they can't even get ₹1 discount, so we hide the section to keep UI clean.
    if (!userCoins || userCoins < conversionRate) return null;

    const isApplied = coinsUsed > 0;
    const potentialDiscount = (sliderValue / conversionRate).toFixed(0);

    const handleSliderChange = (e) => {
        setSliderValue(parseInt(e.target.value));
    };

    return (
        <div className="mb-4">
            <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 border-2 ${
                isBelowThreshold
                ? 'bg-gray-50 border-gray-100 opacity-80'
                : (isApplied 
                    ? 'bg-amber-50/50 border-amber-200 shadow-sm' 
                    : 'bg-white border-dashed border-gray-200 hover:border-amber-200 transition-colors')
            }`}>
                <div className="p-3 sm:p-4">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                                isBelowThreshold 
                                ? 'bg-gray-200 text-gray-400' 
                                : (isApplied ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600')
                            }`}>
                                <FaCoins size={12} className={isApplied ? 'animate-pulse' : ''} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700">RG Coins</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Balance: {userCoins}</span>
                            {isApplied && (
                                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase">Applied</span>
                            )}
                        </div>
                    </div>

                    {isBelowThreshold ? (
                        <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-dashed border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                Add {currencySymbol}{(minOrderForRedemption - totalBeforeCoins).toFixed(0)} more to redeem
                            </p>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">LOCKED</span>
                        </div>
                    ) : (
                        /* Compact Slider Area */
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max={maxSelectable}
                                    step={conversionRate}
                                    value={sliderValue}
                                    onChange={handleSliderChange}
                                    className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <div className="min-w-[60px] text-right">
                                    <span className="text-sm font-black text-amber-600">{sliderValue}</span>
                                    <span className="text-[9px] font-bold text-gray-400 ml-1">COIN</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold text-gray-500">
                                    {sliderValue > 0 ? (
                                        <span className="flex items-center gap-1">
                                            Save <span className="text-amber-700 font-black">{currencySymbol}{potentialDiscount}</span>
                                        </span>
                                    ) : (
                                        "Slide to save"
                                    )}
                                </div>
                                
                                <button
                                    onClick={() => onToggle(sliderValue === coinsUsed && isApplied ? 0 : sliderValue)}
                                    disabled={sliderValue === 0 && !isApplied}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                        isApplied && sliderValue === coinsUsed
                                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-100'
                                    }`}
                                >
                                    {isApplied && sliderValue === coinsUsed ? 'Remove' : (isApplied ? 'Update' : 'Apply')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RGCoinSection;