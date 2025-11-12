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

  // Time slots configuration with start times in minutes
  const allTimeSlots = [
    { id: 'morning', time: '7:00 AM – 10:00 AM', startTime: 7 * 60, endTime: 10 * 60 }, // 7:00 AM = 420 minutes
    { id: 'afternoon', time: '12:00 PM – 2:00 PM', startTime: 12 * 60, endTime: 14 * 60 }, // 12:00 PM = 720 minutes
    { id: 'evening', time: '5:00 PM – 8:00 PM', startTime: 17 * 60, endTime: 20 * 60 } // 5:00 PM = 1020 minutes
  ];

  // Get current time in minutes since midnight
  const getCurrentTimeInMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  // Check if a time slot is available for today
  const isSlotAvailableToday = (slot) => {
    const currentTime = getCurrentTimeInMinutes();
    // Slot is available if current time is before slot end time (with 30 min buffer for order processing)
    return currentTime < (slot.endTime - 30);
  };

  // Check if a time slot is available for a specific date
  const isSlotAvailable = (slot, date) => {
    const today = new Date().toISOString().split('T')[0];
    
    // If it's today, check if the slot hasn't passed yet
    if (date === today) {
      return isSlotAvailableToday(slot);
    }
    
    // For future dates, all slots are available
    return true;
  };

  // Generate available dates (next 7 days)
  useEffect(() => {
    const dates = [];
    const today = new Date();
    const currentTime = getCurrentTimeInMinutes();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Check if this date has any available slots
      const hasAvailableSlots = allTimeSlots.some(slot => isSlotAvailable(slot, dateString));
      
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
        }),
        available: hasAvailableSlots
      });
    }
    
    setAvailableDates(dates);
    
    // Set default date to first available date if not set
    if (!selectedDate) {
      const firstAvailableDate = dates.find(date => date.available);
      if (firstAvailableDate) {
        setSelectedDate(firstAvailableDate.date);
      }
    }
  }, []);

  // Update available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const slotsForDate = allTimeSlots.map(slot => ({
        ...slot,
        available: isSlotAvailable(slot, selectedDate)
      }));
      
      setAvailableSlots(slotsForDate);
      
      // Auto-select first available slot if current selection is invalid
      if (selectedSlot) {
        const currentSlot = slotsForDate.find(slot => slot.time === selectedSlot);
        if (!currentSlot || !currentSlot.available) {
          const firstAvailable = slotsForDate.find(slot => slot.available);
          setSelectedSlot(firstAvailable ? firstAvailable.time : '');
        }
      } else {
        // Auto-select first available slot if none selected
        const firstAvailable = slotsForDate.find(slot => slot.available);
        if (firstAvailable) {
          setSelectedSlot(firstAvailable.time);
        }
      }
    }
  }, [selectedDate]);

  // Real-time slot availability check (update every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
          // Only update if selected date is today
          const updatedSlots = allTimeSlots.map(slot => ({
            ...slot,
            available: isSlotAvailable(slot, selectedDate)
          }));
          setAvailableSlots(updatedSlots);
          
          // Clear selection if current slot becomes unavailable
          if (selectedSlot) {
            const currentSlot = updatedSlots.find(slot => slot.time === selectedSlot);
            if (!currentSlot || !currentSlot.available) {
              const firstAvailable = updatedSlots.find(slot => slot.available);
              setSelectedSlot(firstAvailable ? firstAvailable.time : '');
            }
          }
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedDate, selectedSlot]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot.time);
    }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableDates.map((dateObj) => (
            <motion.button
              key={dateObj.date}
              whileHover={{ scale: dateObj.available ? 1.05 : 1 }}
              whileTap={{ scale: dateObj.available ? 0.95 : 1 }}
              onClick={() => dateObj.available && handleDateSelect(dateObj.date)}
              disabled={!dateObj.available}
              className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                selectedDate === dateObj.date
                  ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                  : dateObj.available
                  ? 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                  : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="text-sm font-medium">{dateObj.display.split(' ')[0]}</div>
              <div className="text-xs text-gray-500 mt-1">{dateObj.display.split(' ').slice(1).join(' ')}</div>
              {!dateObj.available && (
                <div className="text-xs text-red-500 mt-1">Full</div>
              )}
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
              Select Time Slot
            </label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availableSlots.map((slot) => (
              <motion.button
                key={slot.id}
                whileHover={{ scale: slot.available ? 1.02 : 1 }}
                whileTap={{ scale: slot.available ? 0.98 : 1 }}
                onClick={() => handleSlotSelect(slot)}
                disabled={!slot.available}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  selectedSlot === slot.time
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : slot.available
                    ? 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="text-sm font-medium">{slot.time}</div>
                {!slot.available && (
                  <div className="text-xs text-red-500 mt-1">Passed</div>
                )}
              </motion.button>
            ))}
          </div>

          {/* No slots available message */}
          {availableSlots.length > 0 && !availableSlots.some(slot => slot.available) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
            >
              <p className="text-yellow-700 text-sm">
                No more delivery slots available for this date. Please select another date.
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