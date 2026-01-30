import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext';

const CartItem = ({ product, navigate, updateCartItem, removeCartItem, CURRENCY, getProductImage, isUnavailable, unavailabilityReason }) => {
    const { updateCustomization, findNextAvailableSlotForProduct, validateAndSetSlot } = useAppContext();
    const [nextSlotInfo, setNextSlotInfo] = useState(null);
    const [loadingNextSlot, setLoadingNextSlot] = useState(false);

    const isStockIssue = !product.inStock;
    const isSlotIssue = isUnavailable;
    const hasIssue = isStockIssue || isSlotIssue;

    useEffect(() => {
        if (isSlotIssue && !isStockIssue) {
            const getNextSlot = async () => {
                setLoadingNextSlot(true);
                try {
                    const next = await findNextAvailableSlotForProduct(product._id);
                    setNextSlotInfo(next);
                } catch (err) {
                    console.error('Failed to find next slot for cart item:', err);
                } finally {
                    setLoadingNextSlot(false);
                }
            };
            getNextSlot();
        } else {
            setNextSlotInfo(null);
        }
    }, [isSlotIssue, product._id, isStockIssue]);

    // Determine styles based on issue type
    let containerClass = "bg-white border-green-100";
    let imageBorderClass = "border-green-200";
    let textClass = "text-gray-900";
    let subTextClass = "text-gray-600";
    let badge = null;

    if (isStockIssue) {
        containerClass = "bg-red-50 border-red-200";
        imageBorderClass = "border-red-300";
        textClass = "text-red-700";
        subTextClass = "text-red-600";
        badge = (
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                Out of Stock
            </span>
        );
    } else if (isSlotIssue) {
        containerClass = "bg-orange-50 border-orange-200";
        imageBorderClass = "border-orange-300";
        textClass = "text-orange-800";
        subTextClass = "text-orange-700";
        badge = (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                Unavailable for Slot
            </span>
        );
    }

    return (
        <div
            className={`flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr] gap-3 sm:gap-0 items-start text-sm font-medium py-3 border-b last:border-b-0 ${containerClass}`}
        >
            {/* Product Details */}
            <div className="flex flex-col w-full px-2">
                <div className="flex items-center gap-3 w-full">
                    <div
                        onClick={() => navigate(`/products/${product.category.toLowerCase()}/${product._id}`)}
                        className={`relative cursor-pointer w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border rounded-lg overflow-hidden bg-white flex-shrink-0 ${imageBorderClass}`}
                    >
                        <img
                            className="w-full h-full object-cover"
                            src={getProductImage(product)}
                            alt={product.name}
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
                            }}
                        />
                        {isStockIssue && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                                <span className="bg-red-600 text-white text-[10px] px-1 py-0.5 rounded font-bold">OUT OF STOCK</span>
                            </div>
                        )}
                        {isSlotIssue && !isStockIssue && (
                            <div className="absolute inset-0 bg-orange-500 bg-opacity-20 flex items-center justify-center">
                                <span className="bg-orange-600 text-white text-[10px] px-1 py-0.5 rounded font-bold">UNAVAILABLE</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-semibold text-sm sm:text-base ${textClass}`}>
                                {product.name}
                            </p>
                            {badge}
                        </div>

                        {isSlotIssue && unavailabilityReason && (
                            <p className="text-xs text-orange-600 mt-0.5 italic">
                                {unavailabilityReason}
                            </p>
                        )}
                        <div className={`text-xs sm:text-sm ${subTextClass} mt-1 space-y-1`}>
                            <p className="flex items-center gap-1">
                                <span>Weight:</span>
                                <span className="font-bold text-gray-800">{product.weight}{product.unit}</span>
                            </p>
                            <p className="flex items-center gap-1">
                                <span>Price:</span>
                                <span className="font-bold text-emerald-600">{CURRENCY}{product.offerPrice}</span>
                                {product.price > product.offerPrice && (
                                    <span className="text-[10px] text-gray-400 line-through decoration-red-400/50">{CURRENCY}{product.price}</span>
                                )}
                            </p>
                            <div className="flex items-center pt-0.5">
                                <span className="mr-2">Qty:</span>
                                <select
                                    onChange={(e) => updateCartItem(product.cartKey, Number(e.target.value))}
                                    value={product.quantity}
                                    disabled={hasIssue}
                                    className={`border rounded px-2 py-1 bg-white focus:ring-1 text-xs sm:text-sm shadow-sm ${hasIssue
                                        ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                                        : 'border-green-200 focus:ring-green-500 focus:border-green-500'
                                        }`}
                                >
                                    {Array.from({ length: product.maxOrderQuantity > 0 ? product.maxOrderQuantity : 10 }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Available Slot Switcher for Cart Items */}
                {isSlotIssue && !isStockIssue && nextSlotInfo && (
                    <div className="mt-3 sm:ml-[76px] p-3 bg-orange-100/50 border border-orange-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-200 p-2 rounded-lg text-orange-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Next Available Delivery</p>
                                <p className="text-xs font-semibold text-orange-700">
                                    {nextSlotInfo.dayOfWeek}, {nextSlotInfo.date.split('-').reverse().join('/')} • {nextSlotInfo.timeSlot.split(' (')[0]}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => validateAndSetSlot(nextSlotInfo, true)}
                            className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl active:translate-y-0.5 transition-all whitespace-nowrap uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 border-orange-800"
                        >
                            <span>Switch to This Slot</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Customization section */}
                {product.isCustomizable && !hasIssue && (
                    <div className="mt-3 pl-0 sm:pl-[76px] w-full">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={product.customization?.isCustomized}
                                onChange={(e) => updateCustomization(product.cartKey, { isCustomized: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                Customize this item?
                                {product.isCustomizable && product.customizationCharges?.length > 0 && (
                                    <span className="text-[10px] text-gray-400 ml-1 font-normal">
                                        ({product.customizationCharges.map(c => `₹${c.charge} for ${c.weight < 1000 ? c.weight + 'g' : (c.weight / 1000) + 'kg'}`).join(', ')})
                                    </span>
                                )}
                                {product.customizationCharge > 0 && (
                                    <span className="ml-2 text-green-600 font-bold">(+₹{product.customizationCharge} added)</span>
                                )}
                            </span>
                        </label>

                        {product.customization?.isCustomized && (
                            <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <textarea
                                    value={product.customization?.instructions}
                                    onChange={(e) => updateCustomization(product.cartKey, { instructions: e.target.value })}
                                    placeholder="Enter customization instructions"
                                    className="w-full mt-1 p-2 text-xs border border-green-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none resize-none bg-green-50/30"
                                    rows="2"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Footer: Subtotal & Remove (Combined Row) */}
            <div className="flex sm:hidden items-center justify-between w-full pt-2 mt-2 px-2 border-t border-dashed border-gray-100">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">Subtotal:</span>
                        <p className={`font-semibold text-sm ${hasIssue ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {CURRENCY}{(product.offerPrice * product.quantity + (product.customizationCharge || 0)).toFixed(2)}
                        </p>
                    </div>
                    {product.customization?.isCustomized && (
                        <span className="text-[10px] text-green-600 font-medium">Includes customization charge</span>
                    )}
                </div>
                <button
                    onClick={() => removeCartItem(product.cartKey)}
                    className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Remove"
                >
                    <Trash2 size={15} />
                </button>
            </div>

            {/* Desktop Only: Subtotal */}
            <div className="hidden sm:flex flex-col justify-center items-center w-full">
                <p className={`font-semibold text-base ${hasIssue ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {CURRENCY}{(product.offerPrice * product.quantity + (product.customizationCharge || 0)).toFixed(2)}
                </p>
                {product.customization?.isCustomized && (
                    <span className="text-[10px] text-green-600 font-medium mt-1">Incl. customization</span>
                )}
            </div>

            {/* Desktop Only: Action Button */}
            <div className="hidden sm:flex justify-center items-center w-full">
                <button
                    onClick={() => removeCartItem(product.cartKey)}
                    className="cursor-pointer p-2 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                >
                    <img
                        src={assets.remove_icon}
                        alt="remove"
                        className="w-5 h-5"
                    />
                </button>
            </div>
        </div>
    );
};

export default CartItem;
