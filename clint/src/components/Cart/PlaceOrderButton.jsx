import React from 'react';
import { useAppContext } from '../../context/AppContext';

const PlaceOrderButton = ({
    placeOrder,
    isPlacingOrder,
    outOfStockItems,
    paymentOption
}) => {
    const { maintenanceMode } = useAppContext();
    const isDisabled = isPlacingOrder || outOfStockItems.length > 0 || maintenanceMode;

    return (
        <button
            onClick={placeOrder}
            disabled={isDisabled}
            className={`w-full py-3.5 text-white font-bold rounded-2xl text-sm sm:text-base transition-all duration-300 active:scale-[0.98] min-h-[52px] flex items-center justify-center gap-2 shadow-sm ${isDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed active:scale-100 shadow-none"
                    : "bg-brand hover:bg-brand-dark hover:shadow-md hover:shadow-brand-primary/10"
                }`}
        >
            {maintenanceMode ? (
                "Ordering Disabled (Maintenance)"
            ) : isPlacingOrder ? (
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
