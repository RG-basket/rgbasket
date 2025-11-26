import React from 'react';
import ScheduledDeliverySelector from '../Servicibility/ScheduledDeliverySelector';

const PaymentDeliverySection = ({
    paymentOption,
    setPaymentOption,
    deliveryDate,
    setDeliveryDate,
    deliverySlot,
    setDeliverySlot
}) => {
    return (
        <div className="mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-medium text-green-700 mb-2">PAYMENT METHOD</p>
            <select
                onChange={(e) => setPaymentOption(e.target.value)}
                value={paymentOption}
                className="w-full border border-green-300 bg-white px-3 py-2 rounded-lg focus:ring-1 focus:ring-green-500 text-sm"
            >
                <option value="COD">Cash On Delivery</option>
            </select>

            <div className="mt-3">
                <ScheduledDeliverySelector
                    selectedDate={deliveryDate}
                    setSelectedDate={setDeliveryDate}
                    selectedSlot={deliverySlot}
                    setSelectedSlot={setDeliverySlot}
                />
            </div>
        </div>
    );
};

export default PaymentDeliverySection;
