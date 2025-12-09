import React from 'react';

const PricingSummary = ({ subtotal, totalMRP, totalSavings, shippingFee, tax, totalAmount, currencySymbol }) => {
    return (
        <div className="text-gray-700 space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm">
            {/* Total MRP */}
            <div className="flex justify-between text-gray-500">
                <span>Original Price (MRP)</span>
                <span className="line-through">{currencySymbol}{(totalMRP || 0).toFixed(2)}</span>
            </div>

            {/* Savings */}
            {totalSavings > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                    <span className="flex items-center gap-1">
                        You Save 🏷️
                    </span>
                    <span>- {currencySymbol}{totalSavings.toFixed(2)} 🎉</span>
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
                <span className="text-green-600 font-semibold">{currencySymbol}{shippingFee}</span>
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
