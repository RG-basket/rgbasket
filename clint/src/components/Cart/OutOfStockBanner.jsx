import React from 'react';
import { motion } from 'framer-motion';

const OutOfStockBanner = ({ outOfStockItems, removeCartItem, removeOutOfStockItems }) => {
    if (outOfStockItems.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-red-800 font-semibold text-sm">
                            {outOfStockItems.length} item(s) out of stock
                        </h3>
                    </div>
                    <p className="text-red-700 text-sm mb-3">
                        Remove out of stock items to place your order
                    </p>
                    <div className="space-y-2">
                        {outOfStockItems.map(item => (
                            <div key={item.cartKey} className="flex items-center justify-between bg-red-100 px-3 py-2 rounded">
                                <span className="text-red-800 text-sm font-medium">{item.name} - {item.weight}</span>
                                <button
                                    onClick={() => removeCartItem(item.cartKey)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={removeOutOfStockItems}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    Remove All Out of Stock
                </button>
            </div>
        </motion.div>
    );
};

export default OutOfStockBanner;
