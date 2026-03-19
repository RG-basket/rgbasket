import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.jsx';

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

    const formatWeight = (weightObj) => {
        if (!weightObj) return "";
        const { weight, unit } = weightObj;
        if (!unit || unit === "piece" || unit === "unit") return weight;
        return `${weight}${unit}`;
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                    />

                    {/* Content Container */}
                    <motion.div
                        className="bg-white w-full md:max-w-[480px] z-[1001] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] flex flex-col md:rounded-3xl rounded-t-[2rem] overflow-hidden pointer-events-auto max-h-[85vh]"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="md:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

                        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
                            <div className="flex gap-3 items-center min-w-0">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 p-1 shrink-0">
                                    <img 
                                        src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'} 
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-sm md:text-base font-bold text-gray-900 leading-tight truncate">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-3 w-1 bg-[#26544a] rounded-full" />
                                        <p className="text-[10px] md:text-xs text-[#26544a] font-bold uppercase tracking-wider">
                                            Select variant
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 outline-none"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto px-4 py-4 custom-scrollbar-light bg-white">
                            <div className="space-y-2.5">
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
                                            className={`p-3 md:p-4 rounded-xl border transition-all flex items-center justify-between ${
                                                qty > 0 
                                                ? 'border-[#26544a] bg-[#26544a]/5 shadow-sm' 
                                                : 'border-gray-100 hover:border-[#26544a]/30 bg-white'
                                            } ${!isAvailable ? 'opacity-50 grayscale select-none' : ''}`}
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm md:text-base ${qty > 0 ? 'text-emerald-900' : 'text-gray-800'}`}>
                                                        {formatWeight(weightObj)}
                                                    </span>
                                                    {discount > 0 && isAvailable && (
                                                        <span className="bg-emerald-100 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                            {Math.round((discount/price)*100)}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-base md:text-lg font-bold text-gray-900">
                                                        {currency}{formatPrice(offerPrice)}
                                                    </span>
                                                    {price > offerPrice && (
                                                        <span className="text-xs text-gray-400 line-through">
                                                            {currency}{formatPrice(price)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="shrink-0 ml-4">
                                                {!isAvailable ? (
                                                    <span className="text-[10px] font-bold text-gray-400 border border-gray-200 px-2 py-1 rounded">
                                                        OUT OF STOCK
                                                    </span>
                                                ) : qty > 0 ? (
                                                    <div className="flex items-center bg-emerald-600 rounded-lg p-0.5 shadow-sm">
                                                        <button
                                                            onClick={() => updateCartItem(itemKey, qty - 1)}
                                                            className="p-1 px-1.5 text-white hover:bg-emerald-700 rounded transition-colors"
                                                        >
                                                            <Minus size={14} strokeWidth={3} />
                                                        </button>
                                                        <span className="px-2 text-sm font-bold text-white min-w-[24px] text-center">
                                                            {qty}
                                                        </span>
                                                        <button
                                                            onClick={() => addToCart(itemKey, 1)}
                                                            className="p-1 px-1.5 text-white hover:bg-emerald-700 rounded transition-colors"
                                                        >
                                                            <Plus size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(itemKey, 1)}
                                                        className="px-5 py-1.5 bg-white border border-emerald-500 text-emerald-600 font-bold text-xs md:text-sm rounded-lg hover:bg-emerald-600 hover:text-white transition-all active:scale-95 shadow-sm"
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

                        <div className="px-5 py-4 border-t border-gray-100 bg-white sticky bottom-0 shrink-0">
                            <button
                                onClick={onClose}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                                    itemsInCartCount > 0
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-emerald-100'
                                    : 'bg-gray-900 text-white shadow-gray-200'
                                }`}
                            >
                                {itemsInCartCount > 0 ? (
                                    <>
                                        <Check size={18} strokeWidth={3} />
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
};

export default VariantSelectionModal;
