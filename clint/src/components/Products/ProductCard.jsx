import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaChevronDown } from "react-icons/fa";
import VariantSelectionModal from "./VariantSelectionModal";
import { formatWeight } from '../../utils/weightFormatter.js';
import SpecialRequestModal from "./SpecialRequestModal";
import SpecialRequestDetailsModal from "./SpecialRequestDetailsModal";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { getEffectivePrice } from "../../utils/pricingUtils.js";

// Global cache for slot availability to prevent redundant API calls
const slotAvailabilityCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

const ProductCard = ({ product: initialProduct, productId, isAvailableForSlot = true, unavailabilityReason = '', hideIfUnavailable = false, className = "", onClick = null }) => {
    const {
        CURRENCY,
        addToCart,
        updateCartItem,
        removeCartItem,
        cartItems,
        getProductById,
        getProductStockStatus,
        selectedSlot,
        checkProductAvailability,
        findNextAvailableSlotForProduct,
        validateAndSetSlot,
        isNonVegTheme,
        requireAuth
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
    const [isSpecialRequestModalOpen, setIsSpecialRequestModalOpen] = useState(false);
    const [isSpecialRequestDetailsOpen, setIsSpecialRequestDetailsOpen] = useState(false);
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
        inStock: (product?.inStock !== false) && (selectedWeight?.inStock !== false) && (((selectedWeight?.stock && selectedWeight.stock > 0) ? selectedWeight.stock : (product?.stock || 0)) > 0),
        stock: (selectedWeight?.stock && selectedWeight.stock > 0) ? selectedWeight.stock : (product?.stock || 0)
    };

    const isStockAvailable = Boolean(stockStatus.inStock && stockStatus.stock > 0);
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
    const productImages = (Array.isArray(product?.images) && product.images.length > 0)
        ? product.images.filter(Boolean)
        : (product?.image ? [product.image] : []);
    const hasMultipleImages = productImages.length > 1;
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Reset active index when product changes
    useEffect(() => {
        setActiveImageIndex(0);
    }, [product?._id]);

    // Touch swipe handling for mobile
    const touchStartXRef = useRef(0);
    const touchStartYRef = useRef(0);
    const isSwipingRef = useRef(false);
    const didSwipeRef = useRef(false);

    const handleTouchStart = (e) => {
        if (!hasMultipleImages) return;
        touchStartXRef.current = e.touches[0].clientX;
        touchStartYRef.current = e.touches[0].clientY;
        isSwipingRef.current = false;
        didSwipeRef.current = false;
    };

    const handleTouchMove = (e) => {
        if (!hasMultipleImages) return;
        const deltaX = e.touches[0].clientX - touchStartXRef.current;
        const deltaY = e.touches[0].clientY - touchStartYRef.current;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            isSwipingRef.current = true;
        }
    };

    const handleTouchEnd = (e) => {
        if (!hasMultipleImages || !isSwipingRef.current) return;
        const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
        if (Math.abs(deltaX) > 25) {
            didSwipeRef.current = true;
            if (deltaX < 0) {
                // Swiped left -> next image
                setActiveImageIndex(prev => (prev < productImages.length - 1 ? prev + 1 : 0));
            } else {
                // Swiped right -> prev image
                setActiveImageIndex(prev => (prev > 0 ? prev - 1 : productImages.length - 1));
            }
            setTimeout(() => {
                didSwipeRef.current = false;
            }, 250);
        }
        isSwipingRef.current = false;
    };

    const handleImageContainerClick = (e) => {
        if (didSwipeRef.current) {
            e.stopPropagation();
            return;
        }
        handleCardClick(e);
    };

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

    const formattedWeightText = (() => {
        const fw = formatWeight(selectedWeight);
        if (fw && typeof fw === 'string') {
            const trimmed = fw.trim();
            if (trimmed && trimmed !== 'undefined' && trimmed !== 'null') {
                return trimmed;
            }
        }
        const wVal = (selectedWeight?.weight != null ? String(selectedWeight.weight) : '').trim();
        const uVal = (selectedWeight?.unit || product?.unit || '').trim();
        const label = (selectedWeight?.label || selectedWeight?.title || selectedWeight?.name || '').trim();

        if (label && label !== 'undefined' && label !== 'null') return label;

        if (wVal && wVal !== 'undefined' && wVal !== 'null') {
            if (uVal && uVal !== 'undefined' && uVal !== 'null') {
                return `${wVal}${uVal}`;
            }
            return wVal;
        }
        if (uVal && uVal !== 'undefined' && uVal !== 'null') {
            return `1 ${uVal}`;
        }
        if (product?.weight) {
            const pw = String(product.weight).trim();
            if (pw && pw !== 'undefined' && pw !== 'null') return pw;
        }
        return '';
    })();

    const effectivePricing = getEffectivePrice(selectedWeight, selectedSlot?.date);
    const price = Number(effectivePricing.price) || 0;
    const offerPrice = Number(effectivePricing.offerPrice) || price;
    const discount = price > offerPrice ? price - offerPrice : 0;
    const discountPercent = price > offerPrice && price > 0 ? Math.round(((price - offerPrice) / price) * 100) : 0;

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

    const handleSpecialRequest = (e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        setIsSpecialRequestModalOpen(true);
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

    const hasCustomWidth = className && /\bw-|\bmax-w-|\bmin-w-/.test(className);

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 ${hasCustomWidth ? '' : 'w-full'} flex flex-col shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group/card ${!isAvailable ? 'opacity-85' : (isNonVegTheme ? 'hover:border-red-200' : 'hover:border-emerald-200')} ${className}`}>
            {/* Top Image Stage - Covers Card Width Edge-to-Edge Like Blinkit */}
            <div
                ref={imageContainerRef}
                className="group cursor-pointer flex items-center justify-center relative select-none w-full"
                onClick={handleImageContainerClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-full aspect-square bg-[#f8f9fa] flex items-center justify-center overflow-hidden relative">
                    {/* Discount Badge - Blinkit Vertical Ribbon Style */}
                    {discount > 0 && isAvailable && (
                        <div className="absolute top-0 left-2.5 z-10 pointer-events-none">
                            <div className="bg-[#256fef] text-white px-1.5 pt-1 pb-1 rounded-b-md shadow-xs flex flex-col items-center leading-none tracking-tight">
                                <span className="text-[8.5px] font-black leading-tight">
                                    {discountPercent > 0 ? `${discountPercent}%` : `${CURRENCY}${formatPrice(discount)}`}
                                </span>
                                <span className="text-[6.5px] font-black leading-tight uppercase opacity-95">
                                    OFF
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Stock / Unavailability Badge - Top Right */}
                    {!isStockAvailable ? (
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                            <span className="inline-block bg-gray-900/85 text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none backdrop-blur-xs">
                                Out of Stock
                            </span>
                        </div>
                    ) : !slotAvailability ? (
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                            <span className="inline-block bg-orange-600/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded leading-none backdrop-blur-xs">
                                Unavailable
                            </span>
                        </div>
                    ) : null}

                    {isImageVisible ? (
                        productImages.length > 0 ? (
                            <div
                                className="flex w-full h-full transition-transform duration-300 ease-out"
                                style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                            >
                                {productImages.map((imgSrc, imgIdx) => {
                                    const isFullCover = Boolean(product?.isFullCoverImage);
                                    return (
                                        <div key={imgIdx} className="w-full h-full shrink-0 flex items-center justify-center">
                                            <img
                                                src={imgSrc}
                                                alt={`${product.name} ${imgIdx + 1}`}
                                                onError={(e) => { e.target.src = "https://placehold.co/400x400?text=No+Image"; }}
                                                className={`w-full h-full transition-transform duration-300 group-hover:scale-105 pointer-events-none ${
                                                    isFullCover ? 'object-cover' : 'object-contain p-1.5 sm:p-2.5'
                                                } ${!isAvailable ? 'opacity-60 grayscale-[0.2]' : ''}`}
                                                loading={imgIdx === 0 ? "lazy" : "eager"}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <img
                                src="https://placehold.co/400x400?text=No+Image"
                                alt={product.name}
                                className={`w-full h-full ${Boolean(product?.isFullCoverImage) ? 'object-cover' : 'object-contain p-1.5 sm:p-2.5'} opacity-60`}
                            />
                        )
                    ) : (
                        <div className="w-full h-full bg-gray-100 animate-pulse" />
                    )}

                    {/* Desktop Hover Arrows */}
                    {hasMultipleImages && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous image"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(prev => (prev > 0 ? prev - 1 : productImages.length - 1));
                                }}
                                className="hidden md:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 shadow-md border border-gray-100 text-gray-700 items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-20 cursor-pointer"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <button
                                type="button"
                                aria-label="Next image"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImageIndex(prev => (prev < productImages.length - 1 ? prev + 1 : 0));
                                }}
                                className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 shadow-md border border-gray-100 text-gray-700 items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-20 cursor-pointer"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </>
                    )}

                    {/* Dot Indicators */}
                    {hasMultipleImages && (
                        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center items-center gap-1 z-20 pointer-events-none">
                            {productImages.map((_, dotIdx) => (
                                <span
                                    key={dotIdx}
                                    className={`transition-all duration-300 rounded-full shadow-xs ${
                                        dotIdx === activeImageIndex
                                            ? (isNonVegTheme ? 'w-3.5 h-1 bg-red-600' : 'w-3.5 h-1 bg-[#0c831f]')
                                            : 'w-1 h-1 bg-gray-400/60'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Info */}
            <div className="p-2 sm:p-2.5 flex-grow flex flex-col space-y-1 sm:space-y-1.5">
                {/* Product Name */}
                <h3
                    className={`text-[11px] sm:text-xs font-semibold text-gray-900 line-clamp-2 min-h-[28px] sm:min-h-[32px] leading-tight cursor-pointer ${isNonVegTheme ? 'hover:text-red-600' : 'hover:text-emerald-600'} transition-colors`}
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
                {!product.isSpecialRequest && (weights.length > 1 || Boolean(formattedWeightText)) && (
                    <div className="relative group/variant" onClick={(e) => e.stopPropagation()}>
                        {weights.length > 1 ? (
                            <>
                                <button
                                    onClick={(e) => {
                                        if (product.isSpecialRequest) {
                                            handleSpecialRequest(e);
                                        } else {
                                            setIsModalOpen(true);
                                        }
                                    }}
                                    className={`md:hidden w-full flex items-center justify-between text-[10px] sm:text-[11px] py-1 px-1.5 sm:p-2 border border-gray-100 rounded-lg sm:rounded-xl bg-gray-50/50 ${isNonVegTheme ? 'hover:bg-red-50' : 'hover:bg-[#26544a]/5'} transition-all duration-300 cursor-pointer group`}
                                >
                                    <span className={`font-bold text-gray-700 truncate ${isNonVegTheme ? 'group-hover:text-red-600' : 'group-hover:text-[#26544a]'}`}>
                                        {formattedWeightText || 'Options'}
                                    </span>
                                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                        <span className="text-[8px] sm:text-[9px] text-gray-400 font-medium">{weights.length} var</span>
                                        <FaChevronDown className={`w-2 h-2 text-gray-400 ${isNonVegTheme ? 'group-hover:text-red-500' : 'group-hover:text-[#26544a]'} transition-transform group-hover:translate-y-0.5`} />
                                    </div>
                                </button>

                                <div className="hidden md:flex flex-wrap gap-1 w-full mt-1">
                                    {weights.slice(0, 3).map((w, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedWeightIndex(idx)}
                                            className={`text-[9px] px-1.5 py-0.5 rounded-lg font-bold border transition-all ${selectedWeightIndex === idx
                                                    ? `${isNonVegTheme ? 'bg-red-600 border-red-600' : 'bg-[#26544a] border-[#26544a]'} text-white shadow-sm`
                                                    : `bg-white text-gray-600 border-gray-100 ${isNonVegTheme ? 'hover:border-red-400 hover:text-red-600' : 'hover:border-[#26544a]/40 hover:text-[#26544a]'}`
                                                }`}
                                        >
                                            {formatWeight(w) || `Var ${idx + 1}`}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="w-full text-[10px] sm:text-[11px] py-1 px-1.5 sm:p-2 border border-gray-50 rounded-lg sm:rounded-xl bg-gray-50/30 text-gray-500 font-bold truncate">
                                {formattedWeightText}
                            </div>
                        )}
                    </div>
                )}

                {/* Price Section */}
                <div className="flex items-baseline gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                    {product.isSpecialRequest ? (
                        <span className={`text-[10px] sm:text-[11px] font-bold ${isNonVegTheme ? 'text-red-600' : 'text-emerald-600'} bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-lg border border-gray-100`}>
                            Price on Req
                        </span>
                    ) : (
                        <>
                            <span className={`text-xs sm:text-sm md:text-base font-black ${!isAvailable ? 'text-gray-400' : 'text-gray-900'} tracking-tight`}>
                                {CURRENCY}{formatPrice(offerPrice)}
                            </span>
                            {price > offerPrice && (
                                <span className="text-[9px] sm:text-[10px] text-gray-400 line-through font-medium">
                                    {CURRENCY}{formatPrice(price)}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Combined Action Section */}
                <div className="mt-auto pt-1 sm:pt-1.5" onClick={(e) => e.stopPropagation()}>
                    {product.isSpecialRequest ? (
                        <div className="flex flex-col gap-1.5 w-full">
                            {/* 1st: Info / Details Button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSpecialRequestDetailsOpen(true);
                                }}
                                className="w-full h-7 px-2 text-[11px] font-bold rounded-lg border border-emerald-300/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                title="View Special Request Info & Details"
                            >
                                <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">Details & Info</span>
                            </button>

                            {/* 2nd (Below): WhatsApp Request Button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    handleSpecialRequest(e);
                                }}
                                className="w-full h-7 px-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-[#25D366] text-white hover:bg-[#128C7E] hover:shadow-md"
                                title="Place Special Request via WhatsApp"
                            >
                                <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                <span className="truncate">Special Request</span>
                            </button>
                        </div>
                    ) : showNextSlotBlock ? (
                        /* Next Slot Button: 2-line stacked layout inside h-8 for bold, prominent readability on mobile */
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                validateAndSetSlot(nextSlotInfo, true);
                            }}
                            className={`w-full h-8 px-1 rounded-lg sm:rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center shadow-xs ${
                                isNonVegTheme
                                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={`Next Available: ${new Date(nextSlotInfo.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (${nextSlotInfo.timeSlot.split(' (')[0]})`}
                        >
                            <span className={`text-[10.5px] sm:text-[11px] font-black uppercase tracking-tight leading-none ${isNonVegTheme ? 'text-red-700' : 'text-emerald-700'}`}>
                                Select Slot
                            </span>
                            <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-600 leading-none mt-0.5">
                                {new Date(nextSlotInfo.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                        </button>
                    ) : totalQuantity > 0 ? (
                        /* Traditional Qty Controls */
                        <div className={`flex items-center justify-between border rounded-lg sm:rounded-xl h-8 px-1 transition-all ${!isAvailable
                            ? 'bg-gray-100 border-gray-200'
                            : (isNonVegTheme ? 'bg-red-50 border-red-200' : 'bg-[#26544a]/5 border-[#26544a]/20')}`}>
                            <button
                                onClick={(e) => handleCartAction(e, () => {
                                    const key = `${product._id}_${selectedWeightIndex}`;
                                    const qty = cartItems[key] || 0;
                                    updateCartItem(key, qty - 1);
                                }, true)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-[#26544a] hover:bg-white'}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold text-sm">−</span>
                            </button>
                            <span className={`text-xs font-bold min-w-[16px] text-center ${!isAvailable ? 'text-gray-500' : (isNonVegTheme ? 'text-red-700' : 'text-[#26544a]')}`}>
                                {totalQuantity}
                            </span>
                            <button
                                onClick={(e) => handleCartAction(e, () => addToCart(`${product._id}_${selectedWeightIndex}`, 1), true)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : (isNonVegTheme ? 'text-red-600 hover:bg-white' : 'text-[#26544a] hover:bg-white')}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold text-sm">+</span>
                            </button>
                        </div>
                    ) : (
                        /* Standard Add Button OR Simple Unavailable Placeholder if NO next slot */
                        <button
                            onClick={(e) => handleCartAction(e, () => addToCart(`${product._id}_${selectedWeightIndex}`, 1))}
                            disabled={!isAvailable}
                            className={`w-full h-8 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 ${!isAvailable
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : (isNonVegTheme
                                    ? "bg-red-600 text-white hover:bg-red-700 shadow-xs"
                                    : "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-xs")
                                }`}
                        >
                            {!isAvailable ? (
                                <span className="text-[10px] font-bold">{getUnavailabilityMessage()}</span>
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

            <SpecialRequestModal
                isOpen={isSpecialRequestModalOpen}
                onClose={() => setIsSpecialRequestModalOpen(false)}
                product={product}
            />

            <SpecialRequestDetailsModal
                isOpen={isSpecialRequestDetailsOpen}
                onClose={() => setIsSpecialRequestDetailsOpen(false)}
                product={product}
                onProceedToRequest={() => setIsSpecialRequestModalOpen(true)}
            />
        </div>
    );
};

export default ProductCard;