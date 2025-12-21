import React from 'react';
import UserInfo from './UserInfo';
import AddressSection from './AddressSection';
import PaymentDeliverySection from './PaymentDeliverySection';
import PricingSummary from './PricingSummary';
import PlaceOrderButton from './PlaceOrderButton';
import OutOfStockWarning from './OutOfStockWarning';
import DeliveryInstruction from './DeliveryInstruction';
import PromoCodeSection from './PromoCodeSection';

const OrderSummary = ({
    user,
    addresses,
    selectedAddress,
    loadingAddresses,
    setShowAddressForm,
    paymentOption,
    setPaymentOption,
    deliveryDate,
    setDeliveryDate,
    deliverySlot,
    setDeliverySlot,
    subtotal,
    totalMRP,
    totalSavings,
    shippingFee,
    tax,
    totalAmount,
    currencySymbol,
    placeOrder,
    isPlacingOrder,
    outOfStockItems,
    unavailableItems,
    instruction,
    setInstruction,
    selectedGift,
    applyPromo,
    removePromo,

    promoCode,
    discountAmount
}) => {
    return (
        <div className="w-full lg:max-w-md bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 h-fit sticky top-20 lg:top-24">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

            {/* User Information */}
            <UserInfo user={user} />

            {/* Address Section */}
            <AddressSection
                addresses={addresses}
                selectedAddress={selectedAddress}
                loadingAddresses={loadingAddresses}
                setShowAddressForm={setShowAddressForm}
            />

            {/* Only show payment/delivery if address exists and no issues */}
            {addresses.length > 0 && selectedAddress && outOfStockItems.length === 0 && (!unavailableItems || Object.keys(unavailableItems).length === 0) && (
                <>
                    {/* Delivery Instruction */}
                    <DeliveryInstruction
                        instruction={instruction}
                        setInstruction={setInstruction}
                    />




                    {/* Payment and Delivery */}
                    <PaymentDeliverySection
                        paymentOption={paymentOption}
                        setPaymentOption={setPaymentOption}
                        deliveryDate={deliveryDate}
                        setDeliveryDate={setDeliveryDate}
                        deliverySlot={deliverySlot}
                        setDeliverySlot={setDeliverySlot}
                    />

                    {/* Promo Code Section */}
                    <PromoCodeSection
                        onApply={applyPromo}
                        onRemove={removePromo}
                        appliedCode={promoCode}
                        discountAmount={discountAmount}
                        currencySymbol={currencySymbol}
                    />

                    {/* Selected Gift (Read Only) */}
                    {selectedGift && (
                        <div className="mb-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-0.5 shadow-lg shadow-emerald-200/50 overflow-hidden">
                            <div className="bg-white dark:bg-gray-900 rounded-[14px] p-4 flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">🎁</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Your Free Gift</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                        {selectedGift}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Pricing Summary */}
                    <PricingSummary
                        subtotal={subtotal}
                        totalMRP={totalMRP}
                        totalSavings={totalSavings}
                        shippingFee={shippingFee}
                        tax={tax}
                        totalAmount={totalAmount}
                        currencySymbol={currencySymbol}
                        discountAmount={discountAmount}
                        promoCode={promoCode}
                    />

                    {/* Order Button */}
                    <PlaceOrderButton
                        placeOrder={placeOrder}
                        isPlacingOrder={isPlacingOrder}
                        outOfStockItems={outOfStockItems}
                        paymentOption={paymentOption}
                    />
                </>
            )}

            {/* Warning when out of stock items exist */}
            <OutOfStockWarning outOfStockItems={outOfStockItems} />

            {/* Warning when unavailable items exist */}
            {unavailableItems && Object.keys(unavailableItems).length > 0 && (
                <div className="mt-4 bg-orange-100 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="font-semibold text-orange-800">Slot Unavailable</h3>
                    </div>
                    <p className="text-sm text-orange-700">
                        Some items in your cart are not available for the selected delivery slot. Please remove them or choose a different slot to proceed.
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderSummary;
