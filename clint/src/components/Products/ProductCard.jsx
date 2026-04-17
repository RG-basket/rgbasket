import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaChevronDown } from "react-icons/fa";
import VariantSelectionModal from "./VariantSelectionModal";
import { formatWeight } from '../../utils/weightFormatter.js';

// Global cache for slot availability to prevent redundant API calls
const slotAvailabilityCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

const ProductCard = ({ product: initialProduct, productId, isAvailableForSlot = true, unavailabilityReason = '', hideIfUnavailable = false, className = "", onClick = null }) => {
    const {
        CURRENCY,
        addToCart,
        removeCartItem,
        cartItems,
        getProductById,
        getProductStockStatus,
        selectedSlot,
        checkProductAvailability,
        findNextAvailableSlotForProduct,
        validateAndSetSlot,
        isNonVegTheme
    } = useAppContext();

    const navigate = useNavigate();

    // Use product from context if productId is provided, otherwise use initialProduct
    const contextProduct = productId ? getProductById(productId) : initialProduct;
    const product = contextProduct || initialProduct;

    const [imageError, setImageError] = useState(false);
    const [slotAvailability, setSlotAvailability] = useState(isAvailableForSlot);
    const [slotUnavailabilityReason, setSlotUnavailabilityReason] = useState(unavailabilityReason);
    const [nextSlotInfo, setNextSlotInfo] = useState(null);
    const [loadingNextSlot, setLoadingNextSlot] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const checkTimeoutRef = useRef(null);
    const [isImageVisible, setIsImageVisible] = useState(false);
    const imageContainerRef = useRef(null);

    // Lazy load images using Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsImageVisible(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '200px' }
        );

        if (imageContainerRef.current) {
            observer.observe(imageContainerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Helper to get numerical weight for sorting/comparison
    const getNumericalWeightValue = (w) => {
        if (!w) return 0;
        const val = parseFloat(w.weight) || 0;
        const unit = w.unit?.toLowerCase() || '';
        if (unit === 'kg' || unit === 'l') return val * 1000;
        return val;
    };

    const weightOptions = (product.weights || []).map((w, idx) => ({ ...w, originalIndex: idx }))
        .sort((a, b) => getNumericalWeightValue(a) - getNumericalWeightValue(b));

    const [selectedWeightIndex, setSelectedWeightIndex] = useState(() => weightOptions[0]?.originalIndex ?? 0);

    const weights = product.weights || [];
    const selectedWeight = weights[selectedWeightIndex] || {};

    useEffect(() => {
        if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
        }

        const checkSlotAvailability = async () => {
            if (product && selectedSlot && selectedSlot.date && selectedSlot.timeSlot) {
                try {
                    const cacheKey = `${product._id}_${selectedSlot.date}_${selectedSlot.timeSlot}`;
                    const cached = slotAvailabilityCache.get(cacheKey);
                    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                        setSlotAvailability(cached.available);
                        setSlotUnavailabilityReason(cached.reason || '');
                        return;
                    }
                    const availability = await checkProductAvailability(
                        product._id,
                        selectedSlot.date,
                        selectedSlot.timeSlot
                    );
                    slotAvailabilityCache.set(cacheKey, {
                        available: availability.available,
                        reason: availability.reason,
                        timestamp: Date.now()
                    });
                    setSlotAvailability(availability.available);
                    setSlotUnavailabilityReason(availability.reason);
                } catch (error) {
                    console.error('Error checking availability:', error);
                    setSlotAvailability(true);
                    setSlotUnavailabilityReason('');
                }
            } else {
                setSlotAvailability(true);
                setSlotUnavailabilityReason('');
            }
        };
        checkTimeoutRef.current = setTimeout(checkSlotAvailability, 100);
        return () => {
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }
        };
    }, [product?._id, selectedSlot?.date, selectedSlot?.timeSlot]);

    const stockStatus = getProductStockStatus ? getProductStockStatus(product?._id, selectedWeightIndex) : {
        inStock: selectedWeight?.inStock ?? product?.inStock ?? false,
        stock: selectedWeight?.stock ?? product?.stock ?? 0
    };

    const isStockAvailable = (stockStatus.inStock && stockStatus.stock > 0);
    const isAvailable = isStockAvailable && slotAvailability;

    useEffect(() => {
        if (!slotAvailability && isStockAvailable) {
            const getNextSlot = async () => {
                setLoadingNextSlot(true);
                try {
                    const next = await findNextAvailableSlotForProduct(product?._id);
                    setNextSlotInfo(next);
                } catch (err) {
                    console.error('Failed to find next slot:', err);
                } finally {
                    setLoadingNextSlot(false);
                }
            };
            getNextSlot();
        } else {
            setNextSlotInfo(null);
        }
    }, [slotAvailability, product?._id, isStockAvailable]);

    const baseUrl = import.meta.env.VITE_API_URL;
    const imageUrl = product?.images?.[0] ? product.images[0] : null;

    useEffect(() => {
        if (weightOptions.length > 0) {
            setSelectedWeightIndex(weightOptions[0].originalIndex);
        }
    }, [product?._id]);

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const variantQuantities = weights.map((w, idx) => {
        const key = `${product._id}_${idx}`;
        return { index: idx, qty: cartItems[key] || 0 };
    });
    const totalQuantity = variantQuantities.reduce((sum, item) => sum + item.qty, 0);
    const activeInCart = variantQuantities.find(v => v.qty > 0);

    useEffect(() => {
        if (activeInCart && (!isModalOpen || !isMobile)) {
            setSelectedWeightIndex(activeInCart.index);
        }
    }, [activeInCart?.index, isModalOpen, isMobile]);

    const price = Number(selectedWeight?.price) || 0;
    const offerPrice = Number(selectedWeight?.offerPrice) || price;
    const discount = price > offerPrice ? price - offerPrice : 0;

    const formatPrice = (v) => {
        const n = Number(v) || 0;
        return Math.round(n);
    };

    const handleCardClick = (e) => {
        if (onClick) onClick(e);
        navigate(`/products/${product.category?.toLowerCase() || "uncategorized"}/${product._id}`);
        window.scrollTo(0, 0);
    };

    const handleCartAction = (e, action, isAdjustment = false) => {
        e.stopPropagation();
        if (!isAvailable) return;
        if (isMobile) {
            const variantsInCartCount = variantQuantities.filter(v => v.qty > 0).length;
            if (totalQuantity === 0 && weights.length > 1) {
                setIsModalOpen(true);
                return;
            }
            if (isAdjustment && variantsInCartCount > 1) {
                setIsModalOpen(true);
                return;
            }
        }
        action();
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getUnavailabilityMessage = () => {
        if (!isStockAvailable) return 'Out of Stock';
        if (!slotAvailability) return 'Unavailable';
        return '';
    };

    if (!product || !product._id || !product.name) return null;
    if (hideIfUnavailable && !isAvailable) return null;

    // Show the "Next Available" block ONLY if it's actually found and item is generally in stock
    const showNextSlotBlock = !isAvailable && isStockAvailable && nextSlotInfo;

    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-2 w-full max-w-[150px] min-w-[140px] h-full flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${!isAvailable ? 'opacity-90' : (isNonVegTheme ? 'hover:border-red-200 hover:scale-[1.02]' : 'hover:border-emerald-200 hover:scale-[1.02]')} ${className}`}>
            {/* Badges Container */}
            <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1 pointer-events-none">
                {!isStockAvailable ? (
                    <div className="bg-red-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-xl shadow-sm">
                        Out of Stock
                    </div>
                ) : !slotAvailability ? (
                    <div className="bg-orange-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-xl shadow-sm">
                        Unavailable
                    </div>
                ) : discount > 0 ? (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xl shadow-sm">
                        Save {CURRENCY}{formatPrice(discount)}
                    </div>
                ) : null}
            </div>

            {/* Image Container */}
            <div
                ref={imageContainerRef}
                className="group cursor-pointer flex items-center justify-center mb-1 relative"
                onClick={handleCardClick}
            >
                <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    {isImageVisible ? (
                        <img
                            src={imageError ? "https://placehold.co/400x400?text=No+Image" : imageUrl}
                            alt={product.name}
                            onError={handleImageError}
                            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 ${!isAvailable ? 'opacity-60 grayscale-[0.2]' : ''}`}
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 animate-pulse" />
                    )}
                </div>
            </div>

            {/* Product Info */}
            <div className="flex-grow flex flex-col space-y-1.5">
                {/* Product Name */}
                <h3
                    className={`text-xs font-semibold text-gray-900 line-clamp-2 h-8 leading-tight cursor-pointer ${isNonVegTheme ? 'hover:text-red-600' : 'hover:text-emerald-600'} transition-colors`}
                    onClick={handleCardClick}
                    title={product.name}
                >
                    {product.name}
                </h3>

                {/* Customizable Indicator */}
                {product.isCustomizable && isStockAvailable && slotAvailability && (
                    <div className="flex items-center gap-1 opacity-80">
                        <span className={`text-[9px] ${isNonVegTheme ? 'bg-red-50 text-red-600' : 'bg-[#26544a]/10 text-[#26544a]'} px-1 py-0.5 rounded font-bold uppercase tracking-tighter`}>
                            ✨ {totalQuantity > 0 ? 'Check Cart' : 'Customizable'}
                        </span>
                    </div>
                )}

                {/* Weight Selector */}
                <div className="relative group/variant" onClick={(e) => e.stopPropagation()}>
                    {weights.length > 1 ? (
                        <>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className={`md:hidden w-full flex items-center justify-between text-[11px] p-2 border border-gray-100 rounded-xl bg-gray-50/50 ${isNonVegTheme ? 'hover:bg-red-50' : 'hover:bg-[#26544a]/5'} transition-all duration-300 cursor-pointer group`}
                            >
                                <span className={`font-bold text-gray-700 ${isNonVegTheme ? 'group-hover:text-red-600' : 'group-hover:text-[#26544a]'}`}>
                                    {formatWeight(selectedWeight)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-400 font-medium">{weights.length} variants</span>
                                    <FaChevronDown className={`w-2 h-2 text-gray-400 ${isNonVegTheme ? 'group-hover:text-red-500' : 'group-hover:text-[#26544a]'} transition-transform group-hover:translate-y-0.5`} />
                                </div>
                            </button>

                            <div className="hidden md:flex flex-wrap gap-1 w-full mt-1">
                                {weights.slice(0, 3).map((w, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedWeightIndex(idx)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold border transition-all ${
                                            selectedWeightIndex === idx
                                            ? `${isNonVegTheme ? 'bg-red-600 border-red-600' : 'bg-[#26544a] border-[#26544a]'} text-white shadow-sm`
                                            : `bg-white text-gray-600 border-gray-100 ${isNonVegTheme ? 'hover:border-red-400 hover:text-red-600' : 'hover:border-[#26544a]/40 hover:text-[#26544a]'}`
                                        }`}
                                    >
                                        {formatWeight(w)}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="w-full text-[11px] p-2 border border-gray-50 rounded-xl bg-gray-50/30 text-gray-500 font-bold">
                            {formatWeight(selectedWeight)}
                        </div>
                    )}
                </div>

                {/* Price Section */}
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-500 font-medium">Price:</span>
                    <span className={`text-sm md:text-base font-black ${!isAvailable ? 'text-gray-400' : 'text-gray-900'} tracking-tight`}>
                        {CURRENCY}{formatPrice(offerPrice)}
                    </span>
                    {price > offerPrice && (
                        <span className="text-[10px] text-gray-400 line-through font-medium">
                            {CURRENCY}{formatPrice(price)}
                        </span>
                    )}
                </div>

                {/* Combined Action Section */}
                <div className="mt-auto pt-1.5" onClick={(e) => e.stopPropagation()}>
                    {showNextSlotBlock ? (
                        /* Next Available Slot Block (Replaces button when unavailable but available later) */
                        <div className={`p-2 rounded-xl border border-dashed flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ${isNonVegTheme ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            <div className="flex flex-col items-center text-center">
                                <span className={`text-[8px] font-black uppercase tracking-wider ${isNonVegTheme ? 'text-red-500' : 'text-emerald-600'}`}>Next Available Slot</span>
                                <div className={`text-[10px] font-bold ${isNonVegTheme ? 'text-red-700' : 'text-emerald-800'} leading-tight`}>
                                    <div className="font-black">{new Date(nextSlotInfo.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                                    <div className="text-[9px] opacity-70">{nextSlotInfo.timeSlot.split(' (')[0]}</div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    validateAndSetSlot(nextSlotInfo, true);
                                }}
                                className={`w-full py-1.5 text-[10px] font-black uppercase rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 relative overflow-hidden group/glow ${
                                    isNonVegTheme 
                                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                }`}
                            >
                                {/* Animated Glow Border */}
                                <div className="absolute inset-0 bg-white/20 animate-pulse opacity-0 group-hover/glow:opacity-100 transition-opacity" />
                                <span className="relative z-10">Select Slot</span>
                                
                                <style dangerouslySetInnerHTML={{ __html: `
                                    @keyframes buttonGlow {
                                        0%, 100% { box-shadow: 0 0 5px currentColor; }
                                        50% { box-shadow: 0 0 20px currentColor; }
                                    }
                                    .group\/glow:hover {
                                        animation: buttonGlow 1.5s infinite ease-in-out;
                                    }
                                `}} />
                            </button>
                        </div>
                    ) : totalQuantity > 0 ? (
                        /* Traditional Qty Controls */
                        <div className={`flex items-center justify-between border rounded-xl h-7 px-1 transition-all ${!isAvailable
                            ? 'bg-gray-100 border-gray-200'
                            : (isNonVegTheme ? 'bg-red-50 border-red-200' : 'bg-[#26544a]/5 border-[#26544a]/20')}`}>
                            <button
                                onClick={(e) => handleCartAction(e, () => removeCartItem(`${product._id}_${selectedWeightIndex}`), true)}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#26544a] hover:bg-white'}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold">−</span>
                            </button>
                            <span className={`text-xs font-bold min-w-[16px] text-center ${!isAvailable ? 'text-gray-500' : (isNonVegTheme ? 'text-red-700' : 'text-[#26544a]')}`}>
                                {totalQuantity}
                            </span>
                            <button
                                onClick={(e) => handleCartAction(e, () => addToCart(`${product._id}_${selectedWeightIndex}`, 1), true)}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : (isNonVegTheme ? 'text-red-600 hover:bg-white' : 'text-[#26544a] hover:bg-white')}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold">+</span>
                            </button>
                        </div>
                    ) : (
                        /* Standard Add Button OR Simple Unavailable Placeholder if NO next slot */
                        <button
                            onClick={(e) => handleCartAction(e, () => addToCart(`${product._id}_${selectedWeightIndex}`, 1))}
                            disabled={!isAvailable}
                            className={`w-full h-7 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 shadow-sm active:scale-95 ${!isAvailable
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : (isNonVegTheme 
                                    ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                                    : "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-sm")
                                }`}
                        >
                            {!isAvailable ? (
                                <span className="text-[10px] font-medium">{getUnavailabilityMessage()}</span>
                            ) : (
                                <>
                                    <FaShoppingCart className="w-2.5 h-2.5" />
                                    ADD
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <VariantSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
            />
        </div>
    );
};

export default ProductCard;