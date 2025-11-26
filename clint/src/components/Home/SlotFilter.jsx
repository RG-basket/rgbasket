import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SlotFilter = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dates, setDates] = useState([]);

    useEffect(() => {
        // Generate next 3 days
        const nextDates = [];
        const today = new Date();
        for (let i = 0; i < 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            nextDates.push({
                value: d.toISOString().split('T')[0],
                display: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'long' })
            });
        }
        setDates(nextDates);
        setSelectedDate(nextDates[0].value);
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchSlots(selectedDate);
        }
    }, [selectedDate]);

    const fetchSlots = async (date) => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots/availability?date=${date}`);
            if (!response.ok) {
                throw new Error('Failed to fetch slots');
            }
            const data = await response.json();
            // Ensure data is an array
            setSlots(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching slots:', error);
            setSlots([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (slotName) => {
        navigate(`/products?slot=${slotName}&date=${selectedDate}`);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Shop by Delivery Slot</h2>
            </div>

            <div className="space-y-6">
                {/* Date Selection */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {dates.map((date) => (
                        <button
                            key={date.value}
                            onClick={() => setSelectedDate(date.value)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all ${selectedDate === date.value
                                ? 'bg-green-600 text-white border-green-600 shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                                }`}
                        >
                            <div className="text-xs opacity-80">{date.label}</div>
                            <div className="font-semibold">{date.display}</div>
                        </button>
                    ))}
                </div>

                {/* Slots */}
                {loading ? (
                    <div className="flex gap-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 w-32 bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {slots.map((slot) => (
                            <motion.button
                                key={slot._id}
                                whileHover={{ scale: slot.isAvailable ? 1.02 : 1 }}
                                whileTap={{ scale: slot.isAvailable ? 0.98 : 1 }}
                                onClick={() => slot.isAvailable && handleSlotClick(slot.name)}
                                disabled={!slot.isAvailable}
                                className={`relative p-4 rounded-xl border text-left transition-all ${slot.isAvailable
                                    ? 'bg-white border-gray-200 hover:border-green-500 hover:shadow-md cursor-pointer group'
                                    : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-gray-900">{slot.name}</span>
                                    {slot.isAvailable ? (
                                        <ArrowRight className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                            {slot.reason}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {slot.startTime} - {slot.endTime}
                                </div>
                                {slot.isAvailable && (
                                    <div className="mt-2 text-xs text-green-600 font-medium">
                                        View Available Products
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlotFilter;