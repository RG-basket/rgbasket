import React from 'react';
import { Trash2 } from 'lucide-react';
import { assets } from '../../assets/assets';

const CartItem = ({ product, navigate, updateCartItem, removeCartItem, CURRENCY, getProductImage, isUnavailable, unavailabilityReason }) => {
    const isStockIssue = !product.inStock;
    const isSlotIssue = isUnavailable;
    const hasIssue = isStockIssue || isSlotIssue;

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
            className={`flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr] gap-3 sm:gap-0 items-center text-sm font-medium py-3 border-b last:border-b-0 ${containerClass}`}
        >
            {/* Product Details */}
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
                    <div className={`text-xs sm:text-sm ${subTextClass} mt-1`}>
                        <p>Weight: <span className="font-medium">{product.weight}</span></p>
                        <div className="flex items-center mt-1">
                            <span className="mr-2">Qty:</span>
                            <select
                                onChange={(e) => updateCartItem(product.cartKey, Number(e.target.value))}
                                value={product.quantity}
                                disabled={hasIssue}
                                className={`border rounded px-2 py-1 bg-white focus:ring-1 text-xs sm:text-sm ${hasIssue
                                    ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                                    : 'border-green-300 focus:ring-green-500'
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

            {/* Mobile Footer: Subtotal & Remove (Combined Row) */}
            <div className="flex sm:hidden items-center justify-between w-full pt-2 mt-2 border-t border-dashed border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Subtotal:</span>
                    <p className={`font-semibold text-sm ${hasIssue ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {CURRENCY}{(product.offerPrice * product.quantity).toFixed(2)}
                    </p>
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
            <div className="hidden sm:flex justify-center items-center w-auto">
                <p className={`font-semibold text-base ${hasIssue ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {CURRENCY}{(product.offerPrice * product.quantity).toFixed(2)}
                </p>
            </div>

            {/* Desktop Only: Action Button */}
            <div className="hidden sm:flex justify-center items-center w-auto">
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
