import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';

/**
 * PricingSummary
 * Updated to be theme-aware (Red for Non-Veg, Emerald for Veg).
 */
const PricingSummary = ({
    subtotal,
    totalMRP,
    totalSavings,
    shippingFee,
    tax,
    totalAmount,
    currencySymbol,
    discountAmount = 0,
    promoCode = null,
    baseShippingFee = 29,
    standardFee = 29,
    distanceSurcharge = 0,
    tipAmount = 0,
    instruction = ""
}) => {
    const { isNonVegTheme } = useAppContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const summaryRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsExpanded(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (summaryRef.current) {
            observer.observe(summaryRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const themeColor = isNonVegTheme ? 'red' : 'emerald';
    const accentColor = isNonVegTheme ? 'red' : 'green';

    return (
        <div ref={summaryRef} className={`text-gray-700 space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm`}>
            {/* Collapsible Pricing Details */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {/* Total MRP */}
                <div className="flex justify-between text-gray-500 pt-2">
                    <span>Original Price (MRP)</span>
                    <span className="line-through">{currencySymbol}{(totalMRP || 0).toFixed(2)}</span>
                </div>

                {totalSavings > 0 && (
                    <div className={`flex justify-between text-${accentColor}-600 font-medium`}>
                        <span className="flex items-center gap-1">
                            You Save 🏷️
                        </span>
                        <span>- {currencySymbol}{totalSavings.toFixed(2)} 🎉</span>
                    </div>
                )}

                {/* Promo Code Discount */}
                {discountAmount > 0 && (
                    <div className={`flex justify-between text-${accentColor}-700 font-medium bg-${accentColor}-50/50 p-1.5 rounded-lg border border-${accentColor}-100 border-dashed mt-2`}>
                        <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 bg-${accentColor}-500 rounded-full animate-pulse`} />
                            Promo Discount ({promoCode ? promoCode : 'Applied'})
                        </span>
                        <span>- {currencySymbol}{discountAmount.toFixed(2)} 🔥</span>
                    </div>
                )}

                <hr className={`border-${accentColor}-100 my-2 border-dashed`} />

                {/* Subtotal */}
                <div className="flex justify-between font-medium">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-gray-900">{currencySymbol}{(subtotal - discountAmount).toFixed(2)}</span>
                </div>

                {/* Convenience Fee Split */}
                <div className="space-y-2 mt-2">
                    <div className="flex justify-between items-center text-gray-900">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Standard Delivery</span>
                        </div>
                        {shippingFee === 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 line-through text-xs">{currencySymbol}29</span>
                                <span className={`text-${accentColor}-600 font-semibold`}>{currencySymbol}0</span>
                            </div>
                        ) : (
                            <span className="font-semibold text-gray-900">{currencySymbol}{standardFee}</span>
                        )}
                    </div>

                    {distanceSurcharge > 0 && shippingFee > 0 && (
                        <div className={`flex justify-between items-start bg-${themeColor}-50/50 p-2 rounded-lg border border-${themeColor}-100 border-dashed animate-in fade-in slide-in-from-top-1 duration-500`}>
                            <div className="flex flex-col">
                                <span className={`text-[11px] font-bold text-${themeColor}-600 uppercase tracking-wider`}>Extra Mile Surcharge</span>
                                <p className={`text-[10px] text-${themeColor}-500 italic max-w-[150px]`}>Helping our partners bring freshness to distant doorsteps 🏠🌱</p>
                            </div>
                            <span className={`font-bold text-${themeColor}-700`}>{currencySymbol}{distanceSurcharge}</span>
                        </div>
                    )}
                </div>

                {/* Delivery Boy Tip */}
                {tipAmount > 0 && (
                    <div className={`flex justify-between items-center text-gray-900 mt-2 bg-${accentColor}-100/30 p-2 rounded-lg border border-${accentColor}-200 border-dashed`}>
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Delivery Hero Tip 💝</span>
                        </div>
                        <span className={`font-bold text-${accentColor}-700`}>{currencySymbol}{tipAmount}</span>
                    </div>
                )}

                {/* Tax */}
                <div className="flex justify-between text-gray-400 mt-2 mb-2">
                    <span>GST & Taxes</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>

                {/* Delivery Instruction Display */}
                {instruction && (
                    <div className={`mt-3 p-3 bg-${themeColor}-50 rounded-xl border border-${themeColor}-100 border-dashed`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs">📝</span>
                            <span className={`text-[10px] font-bold text-${themeColor}-700 uppercase tracking-wider`}>Delivery Instructions</span>
                        </div>
                        <p className={`text-[11px] text-${themeColor}-600 font-medium italic`}>"{instruction}"</p>
                    </div>
                )}
            </div>

            <hr className={`border-${themeColor}-200 my-2 sm:my-3`} />

            {/* Total Amount Row */}
            <div className="flex justify-between items-center py-2">
                <div className="flex flex-col items-start gap-1">
                    <span className="font-extrabold text-gray-900 text-lg sm:text-xl">Order Total</span>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${isExpanded
                            ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            : `bg-${themeColor}-100 text-${themeColor}-700 hover:bg-${themeColor}-600 hover:text-white hover:shadow-lg hover:shadow-${themeColor}-100`
                            }`}
                    >
                        <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                            <FaChevronDown size={10} />
                        </div>
                    </button>
                </div>

                <div className="text-right">
                    <span className={`text-${themeColor}-700 font-extrabold text-2xl sm:text-3xl tracking-tighter`}>
                        {currencySymbol}{totalAmount.toFixed(2)}
                    </span>
                    {!isExpanded && totalSavings > 0 && (
                        <p className={`text-[10px] font-bold text-${themeColor}-600 flex items-center justify-end gap-1`}>
                            <span className={`w-1.5 h-1.5 bg-${themeColor}-500 rounded-full animate-pulse`} />
                            Saved {currencySymbol}{totalSavings.toFixed(2)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingSummary;
