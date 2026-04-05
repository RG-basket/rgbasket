import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.jsx';
import { formatWeight } from '../../utils/weightFormatter.js';

const VariantSelectionModal = ({ isOpen, onClose, product }) => {
    const { 
        cartItems, 
        addToCart, 
        updateCartItem, 
        currency = '₹', 
        getProductStockStatus
    } = useAppContext();

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!product || !isMounted) return null;

    const formatPrice = (v) => {
        const n = Number(v) || 0;
        return Math.round(n);
    };

    const weights = product.weights || [];

    const sortedWeights = [...weights].map((w, idx) => ({ ...w, originalIndex: idx }))
        .sort((a, b) => {
            const getVal = (w) => {
                const v = parseFloat(w.weight) || 0;
                const u = w.unit?.toLowerCase() || '';
                if (u === 'kg' || u === 'l') return v * 1000;
                return v;
            };
            return getVal(a) - getVal(b);
        });

    const itemsInCartCount = sortedWeights.reduce((sum, w) => {
        return sum + (cartItems[`${product._id}_${w.originalIndex}`] || 0);
    }, 0);

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: { opacity: 0, y: "100%", scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                type: 'spring', 
                damping: 25, 
                stiffness: 300,
                duration: 0.4
            }
        },
        exit: { 
            opacity: 0, 
            y: "100%", 
            scale: 0.95,
            transition: { 
                duration: 0.3,
                ease: "easeInOut"
            }
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />

                    {/* Content Container */}
                    <motion.div
                        className="bg-white w-full md:max-w-[480px] z-[10001] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] flex flex-col md:rounded-3xl rounded-t-[2.5rem] overflow-hidden pointer-events-auto max-h-[85vh] relative"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="md:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />

                        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
                            <div className="flex gap-4 items-center min-w-0">
                                <div className="w-14 h-14 md:w-18 md:h-18 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-100 p-1.5 shrink-0">
                                    <img 
                                        src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'} 
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-base md:text-lg font-bold text-gray-900 leading-tight truncate">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-3.5 w-1 bg-[#26544a] rounded-full" />
                                        <p className="text-[11px] md:text-xs text-[#26544a] font-extrabold uppercase tracking-widest">
                                            Select Variant
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2.5 hover:bg-gray-100 rounded-full transition-all shrink-0 outline-none active:scale-90"
                            >
                                <X className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto px-5 py-5 custom-scrollbar-light bg-gray-50/30">
                            <div className="space-y-3">
                                {sortedWeights.map((weightObj) => {
                                    const itemKey = `${product._id}_${weightObj.originalIndex}`;
                                    const qty = cartItems[itemKey] || 0;
                                    const stockStatus = getProductStockStatus ? getProductStockStatus(product._id, weightObj.originalIndex) : { inStock: true, stock: 10 };
                                    const isAvailable = stockStatus.inStock && stockStatus.stock > 0;
                                    
                                    const price = Number(weightObj.price) || 0;
                                    const offerPrice = Number(weightObj.offerPrice) || price;
                                    const discount = price > offerPrice ? price - offerPrice : 0;

                                    return (
                                        <div 
                                            key={itemKey}
                                            className={`p-4 md:p-5 rounded-2xl border transition-all flex items-center justify-between ${
                                                qty > 0 
                                                ? 'border-[#26544a] bg-white shadow-[0_8px_20px_-6px_rgba(38,84,74,0.15)] ring-1 ring-[#26544a]/10' 
                                                : 'border-gray-200 bg-white hover:border-[#26544a]/30 hover:shadow-md'
                                            } ${!isAvailable ? 'opacity-50 grayscale select-none' : ''}`}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`font-extrabold text-base md:text-lg ${qty > 0 ? 'text-[#26544a]' : 'text-gray-800'}`}>
                                                        {formatWeight(weightObj)}
                                                    </span>
                                                    {discount > 0 && isAvailable && (
                                                        <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {Math.round((discount/price)*100)}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2.5 mt-1">
                                                    <span className="text-lg md:text-xl font-black text-gray-900">
                                                        {currency}{formatPrice(offerPrice)}
                                                    </span>
                                                    {price > offerPrice && (
                                                        <span className="text-sm text-gray-400 line-through font-medium">
                                                            {currency}{formatPrice(price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="shrink-0 ml-4">
                                                {!isAvailable ? (
                                                    <span className="text-[10px] font-black text-gray-400 border-2 border-gray-100 px-3 py-1.5 rounded-full uppercase tracking-widest bg-gray-50">
                                                        Sold Out
                                                    </span>
                                                ) : qty > 0 ? (
                                                    <div className="flex items-center bg-[#26544a] rounded-xl p-1 shadow-lg shadow-emerald-900/20">
                                                        <button
                                                            onClick={() => updateCartItem(itemKey, qty - 1)}
                                                            className="p-1.5 px-2 text-white hover:bg-white/10 rounded-lg transition-colors active:scale-90"
                                                        >
                                                            <Minus size={16} strokeWidth={3} />
                                                        </button>
                                                        <span className="px-3 text-base font-black text-white min-w-[32px] text-center">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            onClick={() => addToCart(itemKey, 1)}
                                                            className="p-1.5 px-2 text-white hover:bg-white/10 rounded-lg transition-colors active:scale-90"
                                                        >
                                                            <Plus size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(itemKey, 1)}
                                                        className="px-6 py-2 bg-white border-2 border-[#26544a] text-[#26544a] font-black text-sm md:text-base rounded-xl hover:bg-[#26544a] hover:text-white transition-all active:scale-95 shadow-sm"
                                                    >
                                                        ADD
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-white sticky bottom-0 shrink-0">
                            <button
                                onClick={onClose}
                                className={`w-full py-4 rounded-2xl font-black text-base md:text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] ${
                                    itemsInCartCount > 0
                                    ? 'bg-gradient-to-r from-[#26544a] to-emerald-700 text-white shadow-[#26544a]/20'
                                    : 'bg-gray-900 text-white shadow-gray-200'
                                }`}
                            >
                                {itemsInCartCount > 0 ? (
                                    <>
                                        <Check size={22} strokeWidth={4} />
                                        DONE • {itemsInCartCount} {itemsInCartCount === 1 ? 'ITEM' : 'ITEMS'} ADDED
                                    </>
                                ) : (
                                    'CLOSE'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default VariantSelectionModal;
