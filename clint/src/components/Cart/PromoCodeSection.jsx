import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PromoCodeSection = ({ onApply, onRemove, appliedCode, discountAmount, currencySymbol = '₹' }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleApply = async () => {
        if (!code.trim()) {
            toast.error('Please enter a promo code');
            return;
        }
        setLoading(true);
        try {
            await onApply(code);
            // Don't clear code if successful? Or clear input but show chip? 
            // Usually clear input.
            setCode('');
        } catch (error) {
            // Error handled by parent or toast
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        onRemove();
        toast.success('Promo code removed');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Promo Code
            </h3>

            {appliedCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex flex-col">
                        <span className="font-bold text-green-700 tracking-wide">{appliedCode}</span>
                        <span className="text-xs text-green-600">
                            Savings: {currencySymbol}{discountAmount.toFixed(2)}
                        </span>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Remove Promo Code"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter Code"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 transition-all uppercase"
                    />
                    <button
                        onClick={handleApply}
                        disabled={loading || !code.trim()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[80px]"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : (
                            'APPLY'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PromoCodeSection;
