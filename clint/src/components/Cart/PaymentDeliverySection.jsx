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
        <div className="mb-6 bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg text-xs">💳</span>
                Payment & Delivery
            </h3>

            <div className="space-y-4">
                <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Payment Method</p>
                    <select
                        onChange={(e) => setPaymentOption(e.target.value)}
                        value={paymentOption}
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer appearance-none"
                    >
                        <option value="COD">💵 Cash On Delivery</option>
                    </select>
                </div>

                <div className="pt-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 ml-1">Select Delivery Slot</p>
                    <ScheduledDeliverySelector
                        selectedDate={deliveryDate}
                        setSelectedDate={setDeliveryDate}
                        selectedSlot={deliverySlot}
                        setSelectedSlot={setDeliverySlot}
                    />
                </div>
            </div>
        </div>
    );
};

export default PaymentDeliverySection;
