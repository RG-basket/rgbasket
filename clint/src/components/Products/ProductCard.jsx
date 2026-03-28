import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaChevronDown } from "react-icons/fa";
import VariantSelectionModal from "./VariantSelectionModal";
import { formatWeight } from '../../utils/weightFormatter.js';

// Global cache for slot availability to prevent redundant API calls
const slotAvailabilityCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

const ProductCard = ({ product: initialProduct, productId, isAvailableForSlot = true, unavailabilityReason = '', hideIfUnavailable = false }) => {
    const {
        currency,
        addToCart,
        removeCartItem,
        cartItems,
        getProductById,
        getProductStockStatus,
        selectedSlot,
        checkProductAvailability,
        findNextAvailableSlotForProduct,
        validateAndSetSlot
    } = useAppContext();

    const navigate = useNavigate();

    // Use product from context if productId is provided, otherwise use initialProduct
    const contextProduct = productId ? getProductById(productId) : initialProduct;
    const product = contextProduct || initialProduct;

    if (!product || !product._id || !product.name) return null;

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
            { rootMargin: '200px' } // Start loading 200px before entering viewport
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

    // Create a sorted version of weights while keeping track of original index
    const weightOptions = (product.weights || []).map((w, idx) => ({ ...w, originalIndex: idx }))
        .sort((a, b) => getNumericalWeightValue(a) - getNumericalWeightValue(b));

    const [selectedWeightIndex, setSelectedWeightIndex] = useState(() => weightOptions[0]?.originalIndex ?? 0);

    const weights = product.weights || [];
    const selectedWeight = weights[selectedWeightIndex] || {};

    // ✅ Optimized slot availability check with caching and debouncing
    useEffect(() => {
        // Clear any pending checks
        if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
        }

        const checkSlotAvailability = async () => {
            if (product && selectedSlot && selectedSlot.date && selectedSlot.timeSlot) {
                try {
                    // Create cache key
                    const cacheKey = `${product._id}_${selectedSlot.date}_${selectedSlot.timeSlot}`;

                    // Check cache first
                    const cached = slotAvailabilityCache.get(cacheKey);
                    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                        setSlotAvailability(cached.available);
                        setSlotUnavailabilityReason(cached.reason || '');
                        return;
                    }

                    // Make API call
                    const availability = await checkProductAvailability(
                        product._id,
                        selectedSlot.date,
                        selectedSlot.timeSlot
                    );

                    // Update cache
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

        // Debounce the check by 100ms to batch multiple cards loading together
        checkTimeoutRef.current = setTimeout(checkSlotAvailability, 100);

        return () => {
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }
        };
    }, [product?._id, selectedSlot?.date, selectedSlot?.timeSlot]);

    // ✅ REAL-TIME: Get stock status from context
    const stockStatus = getProductStockStatus ? getProductStockStatus(product._id, selectedWeightIndex) : {
        inStock: selectedWeight?.inStock ?? product?.inStock ?? false,
        stock: selectedWeight?.stock ?? product?.stock ?? 0
    };

    // Product is available if it's in stock AND available for the selected slot
    const isStockAvailable = (stockStatus.inStock && stockStatus.stock > 0);
    const isAvailable = isStockAvailable && slotAvailability;

    if (hideIfUnavailable && !isAvailable) return null;

    // ✅ Find next available slot if current one is restricted
    useEffect(() => {
        if (!slotAvailability && isStockAvailable) {
            const getNextSlot = async () => {
                setLoadingNextSlot(true);
                try {
                    const next = await findNextAvailableSlotForProduct(product._id);
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
    const imageUrl = product.images?.[0] ? product.images[0] : null;

    // ✅ Reset to smallest weight if product or weights change
    useEffect(() => {
        if (weightOptions.length > 0) {
            setSelectedWeightIndex(weightOptions[0].originalIndex);
        }
    }, [product._id]);

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : true);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ✅ Variant/Cart Logic: Determine what to show on the card
    // Calculate total quantity across all variants
    const variantQuantities = weights.map((w, idx) => {
        const key = `${product._id}_${idx}`;
        return { index: idx, qty: cartItems[key] || 0 };
    });
    const totalQuantity = variantQuantities.reduce((sum, item) => sum + item.qty, 0);

    // If something is in cart, find the active one
    const activeInCart = variantQuantities.find(v => v.qty > 0);
    
    // Update selectedWeightIndex if something is in cart and we haven't manually changed it
    useEffect(() => {
        if (activeInCart && (!isModalOpen || !isMobile)) {
            setSelectedWeightIndex(activeInCart.index);
        }
    }, [activeInCart?.index, isModalOpen, isMobile]);

    const price = Number(selectedWeight?.price) || 0;
    const offerPrice = Number(selectedWeight?.offerPrice) || price;
    const discount = price > offerPrice ? price - offerPrice : 0;

    // Helper: return integer (no decimals)
    const formatPrice = (v) => {
        const n = Number(v) || 0;
        return Math.round(n);
    };

    const handleCardClick = () => {
        navigate(`/products/${product.category?.toLowerCase() || "uncategorized"}/${product._id}`);
        window.scrollTo(0, 0);
    };

    const handleCartAction = (e, action, isAdjustment = false) => {
        e.stopPropagation();
        if (!isAvailable) return;
        
        // ONLY open modal if on MOBILE. On desktop, proceed directly.
        if (isMobile) {
            // Count how many different variants are currently in cart
            const variantsInCartCount = variantQuantities.filter(v => v.qty > 0).length;

            // If it's an "ADD" action (quantity is 0) and there are multiple variants, show modal
            if (totalQuantity === 0 && weights.length > 1) {
                setIsModalOpen(true);
                return;
            }

            // If it's an adjustment (+ or -) and there are multiple DIFFERENT variants in cart,
            // we MUST show the modal so user can choose which one to adjust
            if (isAdjustment && variantsInCartCount > 1) {
                setIsModalOpen(true);
                return;
            }
        }
        
        // Otherwise (or if it's desktop), perform the action directly on the 'selectedWeightIndex'
        action();
    };

    const handleImageError = () => {
        setImageError(true);
    };

    // Get unavailability message
    const getUnavailabilityMessage = () => {
        if (!isStockAvailable) return 'Out of Stock';
        if (!slotAvailability) return 'Unavailable';
        return '';
    };

    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-2 w-full max-w-[150px] min-w-[140px] h-full flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${!isAvailable ? 'opacity-70 grayscale-[0.3]' : 'hover:border-emerald-200 hover:scale-[1.02]'}`}>
            {/* Badges Container - Top Right */}
            <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1 pointer-events-none">
                {!isStockAvailable ? (
                    <div className="bg-red-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                        Out of Stock
                    </div>
                ) : !slotAvailability ? (
                    <div className="bg-orange-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-sm">
                        Unavailable
                    </div>
                ) : discount > 0 ? (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        Save ₹{formatPrice(discount)}
                    </div>
                ) : null}
            </div>

            {/* Image Container */}
            <div
                ref={imageContainerRef}
                className="group cursor-pointer flex items-center justify-center mb-2 relative"
                onClick={handleCardClick}
            >
                <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    {isImageVisible ? (
                        <img
                            src={imageError ? "https://placehold.co/400x400?text=No+Image" : imageUrl}
                            alt={product.name}
                            onError={handleImageError}
                            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 ${!isAvailable ? 'opacity-60' : ''}`}
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
                    className="text-xs font-semibold text-gray-900 line-clamp-2 h-8 leading-tight cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={handleCardClick}
                    title={product.name}
                >
                    {product.name}
                </h3>

                {/* Customizable Indicator - Simple & Subtle */}
                {product.isCustomizable && isStockAvailable && slotAvailability && (
                    <div className="flex items-center gap-1 opacity-80">
                        <span className="text-[9px] bg-[#26544a]/10 text-[#26544a] px-1 py-0.5 rounded font-bold uppercase tracking-tighter">
                            ✨ {totalQuantity > 0 ? 'Check Cart' : 'Customizable'}
                        </span>
                    </div>
                )}

                {/* Weight Selector / Variant indicator */}
                <div className="relative group/variant" onClick={(e) => e.stopPropagation()}>
                    {weights.length > 1 ? (
                        <>
                            {/* Mobile: Premium Button */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="md:hidden w-full flex items-center justify-between text-[11px] p-2 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-[#26544a]/5 hover:border-[#26544a]/20 transition-all duration-300 cursor-pointer group"
                            >
                                <span className="font-bold text-gray-700 group-hover:text-[#26544a]">
                                    {formatWeight(selectedWeight)}
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-400 font-medium">{weights.length} variants</span>
                                    <FaChevronDown className="w-2 h-2 text-gray-400 group-hover:text-[#26544a] transition-transform group-hover:translate-y-0.5" />
                                </div>
                            </button>

                            {/* Desktop: Interactive Chips/Buttons */}
                            <div className="hidden md:flex flex-wrap gap-1 w-full mt-1">
                                {weights.slice(0, 3).map((w, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedWeightIndex(idx)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold border transition-all ${
                                            selectedWeightIndex === idx
                                            ? 'bg-[#26544a] text-white border-[#26544a] shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-100 hover:border-[#26544a]/40 hover:text-[#26544a]'
                                        }`}
                                    >
                                        {formatWeight(w)}
                                    </button>
                                ))}
                                {weights.length > 3 && (
                                    <div className="text-[9px] text-gray-300 font-bold self-center px-1">
                                        +{weights.length - 3} more
                                    </div>
                                )}
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
                    <span className={`text-sm font-bold ${!isAvailable ? 'text-gray-400' : 'text-gray-900'}`}>
                        {import.meta.env.VITE_CURRENCY}{formatPrice(offerPrice)}
                    </span>
                    {price > offerPrice && (
                        <span className="text-[10px] text-gray-400 line-through">
                            {import.meta.env.VITE_CURRENCY}{formatPrice(price)}
                        </span>
                    )}
                </div>

                {/* Add to Cart Button */}
                <div className="mt-auto pt-1.5" onClick={(e) => e.stopPropagation()}>
                    {totalQuantity > 0 ? (
                        <div className={`flex items-center justify-between border rounded-xl h-7 px-1 transition-all ${!isAvailable
                            ? 'bg-gray-100 border-gray-200'
                            : 'bg-[#26544a]/5 border-[#26544a]/20 hover:bg-[#26544a]/10'}`}>
                            <button
                                onClick={(e) => handleCartAction(e, () => removeCartItem(`${product._id}_${selectedWeightIndex}`), true)}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#26544a] hover:bg-white hover:shadow-sm active:scale-95'}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold">−</span>
                            </button>
                            <span className={`text-xs font-bold min-w-[16px] text-center ${!isAvailable ? 'text-gray-500' : 'text-[#26544a]'}`}>
                                {totalQuantity}
                            </span>
                            <button
                                onClick={(e) => handleCartAction(e, () => addToCart(`${product._id}_${selectedWeightIndex}`, 1), true)}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#26544a] hover:bg-white hover:shadow-sm active:scale-95'}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold">+</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => handleCartAction(e, () => addToCart(`${product._id}_${selectedWeightIndex}`, 1))}
                            disabled={!isAvailable}
                            className={`w-full h-7 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 shadow-sm active:scale-95 ${!isAvailable
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 hover:shadow-lg border border-emerald-500/20"
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

                {/* Next Available Slot Action */}
                {!slotAvailability && isStockAvailable && nextSlotInfo && (
                    <div className="mt-2 p-1.5 bg-orange-50 rounded-lg border border-orange-100 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-1">
                        <div>
                            <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Next Available Delivery</p>
                            <p className="text-xs font-extrabold text-orange-600">
                                {nextSlotInfo.dayOfWeek}, {nextSlotInfo.date.split('-').reverse().join('/')} • {nextSlotInfo.timeSlot.split(' (')[0]}
                            </p>
                        </div>
                        <button
                            onClick={() => validateAndSetSlot(nextSlotInfo, true)}
                            className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-bold rounded-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 border-b-2 border-orange-800 uppercase tracking-wider"
                        >
                            <span>Select This Slot</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Variant Selection Modal */}
            <VariantSelectionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
            />
        </div>
    );
};

export default ProductCard;