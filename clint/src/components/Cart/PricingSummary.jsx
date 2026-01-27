import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

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
    tipAmount = 0
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    return (
        <div className="text-gray-700 space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm">
            {/* Collapsible Pricing Details */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {/* Total MRP */}
                <div className="flex justify-between text-gray-500 pt-2">
                    <span>Original Price (MRP)</span>
                    <span className="line-through">{currencySymbol}{(totalMRP || 0).toFixed(2)}</span>
                </div>

                {totalSavings > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                        <span className="flex items-center gap-1">
                            You Save 🏷️
                        </span>
                        <span>- {currencySymbol}{totalSavings.toFixed(2)} 🎉</span>
                    </div>
                )}

                {/* Promo Code Discount (Moved Above) */}
                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700 font-medium bg-green-50/50 p-1.5 rounded-lg border border-green-100 border-dashed mt-2">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Promo Discount ({promoCode ? promoCode : 'Applied'})
                        </span>
                        <span>- {currencySymbol}{discountAmount.toFixed(2)} 🔥</span>
                    </div>
                )}

                <hr className="border-green-100 my-2 border-dashed" />

                {/* Subtotal - Now shows Net Items Total */}
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
                                <span className="text-green-600 font-semibold">{currencySymbol}0</span>
                            </div>
                        ) : (
                            <span className="font-semibold text-gray-900">{currencySymbol}{standardFee}</span>
                        )}
                    </div>

                    {distanceSurcharge > 0 && shippingFee > 0 && (
                        <div className="flex justify-between items-start bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 border-dashed animate-in fade-in slide-in-from-top-1 duration-500">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Extra Mile Surcharge</span>
                                <p className="text-[10px] text-emerald-500 italic max-w-[150px]">Helping our partners bring freshness to distant doorsteps 🏠🌱</p>
                            </div>
                            <span className="font-bold text-emerald-700">{currencySymbol}{distanceSurcharge}</span>
                        </div>
                    )}
                </div>

                {/* Delivery Boy Tip */}
                {tipAmount > 0 && (
                    <div className="flex justify-between items-center text-gray-900 mt-2 bg-green-100/30 p-2 rounded-lg border border-green-200 border-dashed">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-700">Delivery Hero Tip 💝</span>
                        </div>
                        <span className="font-bold text-green-700">{currencySymbol}{tipAmount}</span>
                    </div>
                )}

                {/* Tax */}
                <div className="flex justify-between text-gray-400 mt-2 mb-2">
                    <span>GST & Taxes</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
            </div>

            <hr className="border-green-200 my-2 sm:my-3" />

            {/* Total Amount Row - Clean & Professional */}
            <div className="flex justify-between items-center py-2">
                <div className="flex flex-col items-start gap-1">
                    <span className="font-extrabold text-gray-900 text-lg sm:text-xl">Order Total</span>

                    {/* Compact Interactive Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${isExpanded
                                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-100'
                            }`}
                    >
                        <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                            <FaChevronDown size={10} />
                        </div>
                    </button>
                </div>

                <div className="text-right">
                    <span className="text-green-700 font-extrabold text-2xl sm:text-3xl tracking-tighter">
                        {currencySymbol}{totalAmount.toFixed(2)}
                    </span>
                    {!isExpanded && totalSavings > 0 && (
                        <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Saved {currencySymbol}{totalSavings.toFixed(2)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PricingSummary;
