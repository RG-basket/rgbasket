import React from 'react';

const PricingSummary = ({ subtotal, totalMRP, totalSavings, shippingFee, tax, totalAmount, currencySymbol, discountAmount = 0, promoCode = null }) => {
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

                {/* Convenience Fee */}
                <div className="flex justify-between mt-2">
                    <span>Convenience Fee</span>
                    {shippingFee === 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through text-xs">{currencySymbol}29</span>
                            <span className="text-green-600 font-semibold">{currencySymbol}0</span>
                        </div>
                    ) : (
                        <span className="text-gray-900 font-semibold">{currencySymbol}{shippingFee}</span>
                    )}
                </div>

                {/* Tax */}
                <div className="flex justify-between text-gray-400 mt-2 mb-2">
                    <span>GST & Taxes</span>
                    <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
            </div>

            <hr className="border-green-200 my-2 sm:my-3" />

            {/* Total Amount (Always Visible) */}
            <div
                className="flex justify-between items-center font-black text-gray-900 text-base sm:text-xl cursor-pointer select-none group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col items-start">
                    <span>Order Total:</span>
                    <span className="text-[10px] sm:text-xs font-medium text-green-600 underline decoration-green-300 underline-offset-2 hover:text-green-700">
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                    </span>
                </div>
                <span className="text-green-700">{currencySymbol}{totalAmount.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default PricingSummary;
