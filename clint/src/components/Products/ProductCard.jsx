import React, { useState, useEffect } from "react";
import { useAppContext } from '/src/context/AppContext.jsx';
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

const ProductCard = ({ product: initialProduct, productId, isAvailableForSlot = true, unavailabilityReason = '' }) => {
    const {
        currency,
        addToCart,
        removeCartItem,
        cartItems,
        getProductById,
        getProductStockStatus,
        selectedSlot,
        checkProductAvailability
    } = useAppContext();

    const navigate = useNavigate();

    // Use product from context if productId is provided, otherwise use initialProduct
    const contextProduct = productId ? getProductById(productId) : initialProduct;
    const product = contextProduct || initialProduct;

    if (!product || !product._id || !product.name) return null;

    const [imageError, setImageError] = useState(false);
    const [slotAvailability, setSlotAvailability] = useState(isAvailableForSlot);
    const [slotUnavailabilityReason, setSlotUnavailabilityReason] = useState(unavailabilityReason);

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

    // ✅ Check slot availability when selectedSlot changes
    useEffect(() => {
        const checkSlotAvailability = async () => {
            if (product && selectedSlot && selectedSlot.date && selectedSlot.timeSlot) {
                try {
                    const availability = await checkProductAvailability(
                        product._id,
                        selectedSlot.date,
                        selectedSlot.timeSlot
                    );
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

        checkSlotAvailability();
    }, [product, selectedSlot, checkProductAvailability]);

    // ✅ REAL-TIME: Get stock status from context
    const stockStatus = getProductStockStatus ? getProductStockStatus(product._id, selectedWeightIndex) : {
        inStock: selectedWeight?.inStock ?? product?.inStock ?? false,
        stock: selectedWeight?.stock ?? product?.stock ?? 0
    };

    // Product is available if it's in stock AND available for the selected slot
    const isStockAvailable = stockStatus.inStock && stockStatus.stock > 0;
    const isAvailable = isStockAvailable && slotAvailability;

    const baseUrl = import.meta.env.VITE_API_URL;
    const imageUrl = product.images?.[0] ? product.images[0] : null;

    // ✅ Reset to smallest weight if product or weights change
    useEffect(() => {
        if (weightOptions.length > 0) {
            setSelectedWeightIndex(weightOptions[0].originalIndex);
        }
    }, [product._id]);

    // Use weightIndex for cart key to match AppContext
    const cartKey = `${product._id}_${selectedWeightIndex}`;
    const quantity = cartItems[cartKey] || 0;

    const price = Number(selectedWeight?.price) || 0;
    const offerPrice = Number(selectedWeight?.offerPrice) || price;
    const discount = price > offerPrice ? price - offerPrice : 0;

    // Helper: return integer (no decimals)
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

    const handleCardClick = () => {
        navigate(`/products/${product.category?.toLowerCase() || "uncategorized"}/${product._id}`);
        window.scrollTo(0, 0);
    };

    const handleCartAction = (e, action) => {
        e.stopPropagation();
        if (!isAvailable) return;
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
        <div className={`bg-white rounded-xl border border-gray-100 p-2 w-full max-w-[150px] min-w-[140px] shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${!isAvailable ? 'opacity-70 grayscale-[0.3]' : 'hover:border-emerald-200 hover:scale-[1.02]'}`}>
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
                className="group cursor-pointer flex items-center justify-center mb-2 relative"
                onClick={handleCardClick}
            >
                <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                        src={imageError ? "https://placehold.co/400x400?text=No+Image" : imageUrl}
                        alt={product.name}
                        onError={handleImageError}
                        className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 ${!isAvailable ? 'opacity-60' : ''}`}
                        loading="lazy"
                    />
                </div>
            </div>

            {/* Product Info */}
            <div className="space-y-1.5">
                {/* Product Name */}
                <h3
                    className="text-xs font-semibold text-gray-900 line-clamp-2 h-8 leading-tight cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={handleCardClick}
                    title={product.name}
                >
                    {product.name}
                </h3>

                {/* Weight Selector */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <select
                        className={`w-full text-[10px] p-1.5 border rounded-lg bg-white focus:outline-none transition-all cursor-pointer appearance-none pr-5 ${!isAvailable
                            ? 'border-gray-200 bg-gray-50 text-gray-400'
                            : 'border-gray-200 hover:border-emerald-300 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 text-gray-700'}`}
                        value={selectedWeightIndex}
                        onChange={(e) => setSelectedWeightIndex(Number(e.target.value))}
                        disabled={weights.length <= 1 || !isAvailable}
                    >
                        {weightOptions.map((w) => (
                            <option key={w.originalIndex} value={w.originalIndex}>
                                {formatWeight(w)}
                            </option>
                        ))}
                    </select>
                    {weights.length > 1 && (
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-2 h-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
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
                <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                    {quantity > 0 ? (
                        <div className={`flex items-center justify-between border rounded-xl h-7 px-1 transition-all ${!isAvailable
                            ? 'bg-gray-100 border-gray-200'
                            : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}>
                            <button
                                onClick={(e) => handleCartAction(e, () => removeCartItem(cartKey))}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-emerald-700 hover:bg-white hover:shadow-sm active:scale-95'}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold">−</span>
                            </button>
                            <span className={`text-xs font-bold min-w-[16px] text-center ${!isAvailable ? 'text-gray-500' : 'text-emerald-800'}`}>
                                {quantity}
                            </span>
                            <button
                                onClick={(e) => handleCartAction(e, () => addToCart(cartKey, 1))}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${!isAvailable
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-emerald-700 hover:bg-white hover:shadow-sm active:scale-95'}`}
                                disabled={!isAvailable}
                            >
                                <span className="font-bold">+</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => handleCartAction(e, () => addToCart(cartKey, 1))}
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
            </div>
        </div>
    );
};

export default ProductCard;