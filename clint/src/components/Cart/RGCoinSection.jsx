import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const RGCoinSection = ({
    userCoins = 0,
    coinsUsed = 0,
    coinDiscount = 0,
    onToggle,
    currencySymbol = '₹',
    totalBeforeCoins = 0,
    appliedPromo = null,
    appliedGift = null
}) => {
    const { rewardSettings } = useAppContext();
    const { 
        conversionRate = 10, 
        maxRedemptionRupees = 30,
        minOrderForRedemption = 0
    } = rewardSettings || {};

    const isBelowThreshold = totalBeforeCoins < minOrderForRedemption;
    const amountNeeded = Math.max(0, minOrderForRedemption - totalBeforeCoins);
    const progressPercent = minOrderForRedemption > 0 
        ? Math.min(100, Math.round((totalBeforeCoins / minOrderForRedemption) * 100)) 
        : 100;

    const maxRedemptionCoins = maxRedemptionRupees * conversionRate;
    const maxCoinsByCartTotal = Math.floor(Math.max(0, totalBeforeCoins) * conversionRate);
    const maxSelectable = Math.max(0, Math.min(userCoins, maxRedemptionCoins, maxCoinsByCartTotal));
    const maxDiscountRupees = Math.floor(maxSelectable / conversionRate);

    const [sliderValue, setSliderValue] = useState(coinsUsed || 0);

    useEffect(() => {
        if (isBelowThreshold && coinsUsed > 0) {
            onToggle(0);
        }
        if (sliderValue > maxSelectable) {
            setSliderValue(maxSelectable);
        }
    }, [maxSelectable, isBelowThreshold, coinsUsed]);

    useEffect(() => {
        setSliderValue(coinsUsed || 0);
    }, [coinsUsed]);

    // If user has no coins, hide or show minimal hint
    if (!userCoins || userCoins < conversionRate) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 mb-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-lg text-xs">🪙</span>
                    <span className="text-xs font-bold text-gray-800">RG Coins</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                    Balance: {userCoins || 0} (Earn on delivery)
                </span>
            </div>
        );
    }

    const isApplied = coinsUsed > 0;
    const potentialDiscount = Math.floor(sliderValue / conversionRate);

    const handleSliderChange = (e) => {
        setSliderValue(parseInt(e.target.value, 10));
    };

    return (
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 mb-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-lg text-xs">🪙</span>
                    RG Coins
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">
                        Balance: <span className="text-amber-600 font-black">{userCoins}</span>
                    </span>
                    {isApplied && (
                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                            Applied
                        </span>
                    )}
                </div>
            </div>

            {/* LOCKED STATE */}
            {isBelowThreshold ? (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <span>🔒</span>
                            <span>Locked • Min. order {currencySymbol}{minOrderForRedemption}</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-700">
                            {currencySymbol}{totalBeforeCoins.toFixed(0)} / {currencySymbol}{minOrderForRedemption}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden mb-2">
                        <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <p className="text-[11px] font-semibold text-amber-800">
                        Add <span className="font-extrabold text-amber-900">{currencySymbol}{amountNeeded.toFixed(0)}</span> more to unlock
                    </p>
                </div>
            ) : (
                /* UNLOCKED STATE */
                <div className="flex flex-col gap-2.5">
                    {/* Exclusivity note if promo code or gift is already active */}
                    {(appliedPromo || appliedGift) && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            ℹ️ Applying RG Coins will replace the current active offer.
                        </p>
                    )}

                    {/* Slider & Value Display */}
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="0"
                            max={maxSelectable}
                            step={conversionRate}
                            value={sliderValue}
                            onChange={handleSliderChange}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="min-w-[65px] text-right">
                            <span className="text-sm font-black text-amber-600">{sliderValue}</span>
                            <span className="text-[10px] font-bold text-gray-400 ml-1">Coins</span>
                        </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="text-xs font-bold text-gray-600">
                            {sliderValue > 0 ? (
                                <span>
                                    Save <span className="text-emerald-600 font-extrabold">{currencySymbol}{potentialDiscount}</span>
                                    <span className="text-[10px] text-gray-400 font-normal ml-1">
                                        (Max {currencySymbol}{maxDiscountRupees})
                                    </span>
                                </span>
                            ) : (
                                <span className="text-[11px] text-gray-400">Slide to choose discount</span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            {isApplied && sliderValue === coinsUsed ? (
                                <button
                                    type="button"
                                    onClick={() => onToggle(0)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 transition-all active:scale-95"
                                >
                                    Remove
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onToggle(sliderValue)}
                                    disabled={sliderValue === 0 && !isApplied}
                                    className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-100 active:scale-95 uppercase tracking-wider"
                                >
                                    {isApplied ? 'Update' : 'Apply'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RGCoinSection;