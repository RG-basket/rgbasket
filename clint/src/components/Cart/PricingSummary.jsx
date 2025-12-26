import React from 'react';

const PricingSummary = ({ subtotal, totalMRP, totalSavings, shippingFee, tax, totalAmount, currencySymbol, discountAmount = 0, promoCode = null }) => {
    return (
        <div className="text-gray-700 space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm">
            {/* Total MRP */}
            <div className="flex justify-between text-gray-500">
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
                <div className="flex justify-between text-green-700 font-medium bg-green-50/50 p-1.5 rounded-lg border border-green-100 border-dashed">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Promo Discount ({promoCode ? promoCode : 'Applied'})
                    </span>
                    <span>- {currencySymbol}{discountAmount.toFixed(2)} 🔥</span>
                </div>
            )}

            <hr className="border-green-100 my-1 sm:my-2 border-dashed" />

            {/* Subtotal - Now shows Net Items Total */}
            <div className="flex justify-between font-medium">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">{currencySymbol}{(subtotal - discountAmount).toFixed(2)}</span>
            </div>

            {/* Convenience Fee */}
            <div className="flex justify-between">
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
            <div className="flex justify-between text-gray-400">
                <span>GST & Taxes</span>
                <span>{currencySymbol}{tax.toFixed(2)}</span>
            </div>

            <hr className="border-green-200 my-2 sm:my-3" />

            {/* Total Amount */}
            <div className="flex justify-between font-black text-gray-900 text-base sm:text-xl">
                <span>Order Total:</span>
                <span className="text-green-700">{currencySymbol}{totalAmount.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default PricingSummary;
