import React from 'react';

const PricingSummary = ({ subtotal, shippingFee, tax, totalAmount, currencySymbol }) => {
    return (
        <div className="text-gray-700 space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Convenience Fee</span>
                <span className="text-green-600 font-semibold">{currencySymbol}{shippingFee}</span>
            </div>
            <div className="flex justify-between">
                <span>Tax (0%)</span>
                <span>{currencySymbol}{tax.toFixed(2)}</span>
            </div>
            <hr className="border-green-200 my-2 sm:my-3" />
            <div className="flex justify-between font-bold text-gray-900 text-base">
                <span>Total Amount:</span>
                <span className="text-green-700">{currencySymbol}{totalAmount.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default PricingSummary;
