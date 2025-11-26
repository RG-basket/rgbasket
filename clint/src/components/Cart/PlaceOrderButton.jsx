import React from 'react';

const PlaceOrderButton = ({
    placeOrder,
    isPlacingOrder,
    outOfStockItems,
    paymentOption
}) => {
    return (
        <button
            onClick={placeOrder}
            disabled={isPlacingOrder || outOfStockItems.length > 0}
            className={`w-full py-3 text-white font-bold rounded-lg text-sm sm:text-base transition-colors min-h-[50px] ${isPlacingOrder || outOfStockItems.length > 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
        >
            {isPlacingOrder ? (
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                </div>
            ) : paymentOption === "COD" ? (
                "Place Order"
            ) : (
                "Proceed to Checkout"
            )}
        </button>
    );
};

export default PlaceOrderButton;
