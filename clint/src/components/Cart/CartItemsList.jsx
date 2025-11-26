import React from 'react';
import CartItem from './CartItem';

const CartItemsList = ({ cartArray, navigate, updateCartItem, removeCartItem, CURRENCY, getProductImage, unavailableItems }) => {
    return (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-green-100 p-4 sm:p-6">
            {/* Header - Hidden on mobile, shown on desktop */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr] text-gray-600 text-sm font-medium pb-3 border-b border-green-200 mb-4">
                <p className="text-left">Product Details</p>
                <p className="text-center">Subtotal</p>
                <p className="text-center">Action</p>
            </div>

            {cartArray.map((product, index) => (
                <CartItem
                    key={index}
                    product={product}
                    navigate={navigate}
                    updateCartItem={updateCartItem}
                    removeCartItem={removeCartItem}
                    CURRENCY={CURRENCY}
                    getProductImage={getProductImage}
                    isUnavailable={unavailableItems && !!unavailableItems[product.cartKey]}
                    unavailabilityReason={unavailableItems && unavailableItems[product.cartKey]}
                />
            ))}
        </div>
    );
};

export default CartItemsList;
