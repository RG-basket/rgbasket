import React from 'react';

const OutOfStockWarning = ({ outOfStockItems }) => {
    if (outOfStockItems.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-semibold text-sm">Cannot Place Order</p>
            </div>
            <p className="text-red-700 text-sm">
                Please remove {outOfStockItems.length} out of stock item(s) to continue with your order.
            </p>
        </div>
    );
};

export default OutOfStockWarning;
