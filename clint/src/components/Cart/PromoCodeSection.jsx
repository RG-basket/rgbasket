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
        <div className="bg-white rounded-2xl border border-emerald-100 p-4 mb-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg text-xs">🏷️</span>
                Promo Code
            </h3>

            {appliedCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-800 tracking-widest uppercase">{appliedCode}</span>
                        <span className="text-[11px] font-bold text-emerald-600 mt-0.5">
                            Saved {currencySymbol}{discountAmount.toFixed(2)} 🎉
                        </span>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="bg-white text-rose-500 hover:bg-rose-50 p-2 rounded-lg shadow-sm border border-rose-100 transition-all active:scale-90"
                        title="Remove"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Enter Code "
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 uppercase tracking-widest"
                        />
                    </div>
                    <button
                        onClick={handleApply}
                        disabled={loading || !code.trim()}
                        className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-100 active:scale-95 uppercase tracking-widest"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                        ) : (
                            'Apply'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PromoCodeSection;
