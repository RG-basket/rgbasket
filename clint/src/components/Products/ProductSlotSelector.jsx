import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

/* -------------------------------
   IST Timezone Utilities
--------------------------------- */
const IST_TIMEZONE = 'Asia/Kolkata';

const getISTDate = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
};

const getISTDateString = (date = null) => {
    const d = date || new Date();
    const istDate = new Date(d.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ProductSlotSelector = ({
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    productId
}) => {
    const [availableDates, setAvailableDates] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Generate available dates (next 3 days) - USING IST
    useEffect(() => {
        const dates = [];
        const today = getISTDate(); // Use IST date

        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = getISTDateString(date); // Use IST date string

            dates.push({
                date: dateString,
                display: date.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                }),
                fullDisplay: date.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            });
        }

        setAvailableDates(dates);

        // Set default date to tomorrow if not set - USING IST
        if (!selectedDate) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            setSelectedDate(getISTDateString(tomorrow));
        }
    }, []);

    // Fetch product-specific slot availability when date changes
    useEffect(() => {
        if (selectedDate && productId) {
            fetchProductSlotAvailability(selectedDate);
        }
    }, [selectedDate, productId]);

    const fetchProductSlotAvailability = async (date) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/products/${productId}/slot-availability?date=${date}`
            );

            if (!response.ok) throw new Error('Failed to fetch slot availability');

            const data = await response.json();

            // Transform API data to match component expectations
            const transformedSlots = data.map(slot => ({
                id: slot._id,
                time: `${slot.name} (${slot.startTime} - ${slot.endTime})`,
                name: slot.name,
                startTime: slot.startTime,
                endTime: slot.endTime,
                available: slot.isAvailable,
                capacity: slot.capacity,
                booked: slot.booked,
                reason: slot.reason
            }));

            setAvailableSlots(transformedSlots);

            // Auto-select first available slot if none selected or current selection is invalid
            if (!selectedSlot || !transformedSlots.find(slot => slot.time === selectedSlot && slot.available)) {
                const firstAvailable = transformedSlots.find(slot => slot.available);
                if (firstAvailable) {
                    setSelectedSlot(firstAvailable.time);
                } else {
                    setSelectedSlot('');
                }
            }
        } catch (error) {
            console.error('Error fetching product slot availability:', error);
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleSlotSelect = (slot) => {
        if (slot.available) {
            setSelectedSlot(slot.time);
        }
    };

    // Format time for better display
    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h4 className="text-base font-semibold text-gray-900">Select Delivery Slot</h4>
            </div>

            {/* Date Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {availableDates.map((dateObj) => (
                        <motion.button
                            key={dateObj.date}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleDateSelect(dateObj.date)}
                            className={`p-2 rounded-lg border-2 text-center transition-all duration-200 ${selectedDate === dateObj.date
                                ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                                }`}
                        >
                            <div className="text-xs font-medium">{dateObj.display.split(' ')[0]}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{dateObj.display.split(' ').slice(1).join(' ')}</div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <label className="block text-sm font-medium text-gray-700">
                            Time Slot {loading && "(Checking...)"}
                        </label>
                    </div>

                    {loading ? (
                        <div className="text-center py-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mx-auto"></div>
                            <p className="text-gray-500 text-xs mt-2">Checking availability...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {availableSlots.map((slot) => (
                                <motion.button
                                    key={slot.id}
                                    whileHover={{ scale: slot.available ? 1.01 : 1 }}
                                    whileTap={{ scale: slot.available ? 0.99 : 1 }}
                                    onClick={() => handleSlotSelect(slot)}
                                    disabled={!slot.available}
                                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${selectedSlot === slot.time
                                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                        : slot.available
                                            ? 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-sm font-medium">{slot.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-medium ${slot.available ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {slot.available ? 'Available' : 'Unavailable'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {slot.booked}/{slot.capacity}
                                            </div>
                                        </div>
                                    </div>
                                    {!slot.available && slot.reason && (
                                        <div className="text-xs text-red-500 mt-1">{slot.reason}</div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* No slots available message */}
                    {!loading && availableSlots.length > 0 && !availableSlots.some(slot => slot.available) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
                        >
                            <p className="text-yellow-700 text-xs">
                                No delivery slots available for this date. Please select another date.
                            </p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Selected Schedule Summary */}
            {selectedDate && selectedSlot && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-900">Selected Delivery</p>
                            <p className="text-blue-700 text-xs">
                                {new Date(selectedDate).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-blue-700 text-xs font-medium">{selectedSlot}</p>
                        </div>
                        <div className="text-blue-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ProductSlotSelector;
