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

            {/* Promo Code Discount */}
            {discountAmount > 0 && (
                <div className="flex justify-between text-green-700 font-medium bg-green-50 p-1 rounded">
                    <span>Promo Discount ({promoCode ? promoCode : 'Applied'})</span>
                    <span>- {currencySymbol}{discountAmount.toFixed(2)} 🔥</span>
                </div>
            )}

            <hr className="border-green-100 my-1 sm:my-2 border-dashed" />

            {/* Subtotal */}
            <div className="flex justify-between">
                <span>Subtotal (Offer Price)</span>
                <span className="font-semibold">{currencySymbol}{subtotal.toFixed(2)}</span>
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
            <div className="flex justify-between">
                <span>Tax</span>
                <span>{currencySymbol}{tax.toFixed(2)}</span>
            </div>

            <hr className="border-green-200 my-2 sm:my-3" />

            {/* Total Amount */}
            <div className="flex justify-between font-bold text-gray-900 text-base sm:text-lg">
                <span>Total Amount:</span>
                <span className="text-green-700">{currencySymbol}{totalAmount.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default PricingSummary;
