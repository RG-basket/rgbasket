import React from 'react';
import { FiAlertCircle, FiX, FiTrash2, FiCheck } from 'react-icons/fi';

const StaleCartModal = ({ isOpen, onClose, staleItems, onRemoveStale, onContinueShopping }) => {
    if (!isOpen || !staleItems || staleItems.length === 0) return null;

    const outOfStockItems = staleItems.filter(item => item.reason === 'out_of_stock');
    const quantityAdjustedItems = staleItems.filter(item => item.reason === 'quantity_adjusted');
    const inactiveItems = staleItems.filter(item => item.reason === 'inactive');

    const hasProblems = outOfStockItems.length > 0 || inactiveItems.length > 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header - Green Theme */}
                <div className={`px-6 py-5 relative overflow-hidden ${hasProblems ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                {hasProblems ? (
                                    <FiAlertCircle className="w-6 h-6 text-white" />
                                ) : (
                                    <FiCheck className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {hasProblems ? 'Cart Update Needed' : 'Cart Updated'}
                                </h3>
                                <p className="text-xs text-white/90 mt-0.5">
                                    {hasProblems ? 'Some items are no longer available' : 'We adjusted quantities for you'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {/* Out of Stock Items */}
                    {outOfStockItems.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">🚫</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Not Available Right Now</h4>
                                    <p className="text-xs text-gray-600">These items are currently out of stock</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {outOfStockItems.map((item, idx) => (
                                    <div key={idx} className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                                        <img
                                            src={item.images?.[0] || item.image?.[0]}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-gray-600">{item.weight} {item.unit}</p>
                                        </div>
                                        <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg whitespace-nowrap">
                                            Out of Stock
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity Adjusted Items */}
                    {quantityAdjustedItems.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">✅</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Quantity Updated</h4>
                                    <p className="text-xs text-gray-600">We adjusted these to available stock</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {quantityAdjustedItems.map((item, idx) => (
                                    <div key={idx} className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                                        <img
                                            src={item.images?.[0] || item.image?.[0]}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-gray-600">{item.weight} {item.unit}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 line-through">Was: {item.requestedQuantity}</div>
                                            <div className="text-xs font-bold text-green-600">Now: {item.availableQuantity}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 bg-green-100 border border-green-200 rounded-xl p-3">
                                <p className="text-xs text-green-800">
                                    <span className="font-semibold">✨ Don't worry!</span> We've updated the quantities based on what's currently available. Your cart is ready to checkout.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Inactive Items */}
                    {inactiveItems.length > 0 && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">📦</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Product Removed</h4>
                                    <p className="text-xs text-gray-600">These items are no longer in our catalog</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {inactiveItems.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                                        <img
                                            src={item.images?.[0] || item.image?.[0]}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0 opacity-50"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-gray-600">{item.weight} {item.unit}</p>
                                        </div>
                                        <div className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded-lg whitespace-nowrap">
                                            Discontinued
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-2">
                    {hasProblems && (
                        <button
                            onClick={onRemoveStale}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            Remove Unavailable ({outOfStockItems.length + inactiveItems.length})
                        </button>
                    )}

                    <button
                        onClick={onContinueShopping}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FiCheck className="w-4 h-4" />
                        {hasProblems ? 'Got It, Continue' : 'Okay, Continue Shopping'}
                    </button>

                    {hasProblems && (
                        <button
                            onClick={onClose}
                            className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 text-sm transition-colors"
                        >
                            I'll decide later
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
      `}</style>
        </div>
    );
};

export default StaleCartModal;
