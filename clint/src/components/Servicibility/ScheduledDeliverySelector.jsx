import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

const ScheduledDeliverySelector = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedSlot, 
  setSelectedSlot 
}) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate available dates (next 3 days)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
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
    
    // Set default date to tomorrow if not set
    if (!selectedDate) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    }
  }, []);

  // Fetch slot availability when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSlotAvailability(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlotAvailability = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/slots/availability?date=${date}`);
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
      console.error('Error fetching slot availability:', error);
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
  const formatTimeDisplay = (slot) => {
    return `${slot.name} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`;
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Calendar className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Schedule Delivery</h3>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Delivery Date
        </label>
        <div className="grid grid-cols-3 gap-3">
          {availableDates.map((dateObj) => (
            <motion.button
              key={dateObj.date}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDateSelect(dateObj.date)}
              className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                selectedDate === dateObj.date
                  ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
              }`}
            >
              <div className="text-sm font-medium">{dateObj.display.split(' ')[0]}</div>
              <div className="text-xs text-gray-500 mt-1">{dateObj.display.split(' ').slice(1).join(' ')}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="w-5 h-5 text-green-600" />
            <label className="block text-sm font-medium text-gray-700">
              Select Time Slot {loading && "(Checking...)"}
            </label>
          </div>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Checking slot availability...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {availableSlots.map((slot) => (
                <motion.button
                  key={slot.id}
                  whileHover={{ scale: slot.available ? 1.02 : 1 }}
                  whileTap={{ scale: slot.available ? 0.98 : 1 }}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selectedSlot === slot.time
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
                      <div className={`text-sm font-medium ${
                        slot.available ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {slot.available ? 'Available' : 'Unavailable'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {slot.booked}/{slot.capacity} booked
                      </div>
                    </div>
                  </div>
                  {!slot.available && slot.reason && (
                    <div className="text-xs text-red-500 mt-2">{slot.reason}</div>
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
              className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
            >
              <p className="text-yellow-700 text-sm">
                No delivery slots available for this date. Please select another date.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Selected Schedule Summary */}
      {selectedDate && selectedSlot && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Scheduled Delivery</p>
              <p className="text-blue-700 text-sm">
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-blue-700 text-sm font-medium">{selectedSlot}</p>
            </div>
            <div className="text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScheduledDeliverySelector;