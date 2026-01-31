import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CalendarClock, Trash2, X, Check, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const UnavailableItemsModal = ({ isOpen, onClose, onRemove, items }) => {
  const { API_URL, validateAndSetSlot, checkProductAvailability } = useAppContext();

  // 1. All Hooks Must Be at the Top
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [activeDate, setActiveDate] = useState(null);

  // 2. Helpers and derived state
  const formatTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return "";
    try {
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
    } catch (err) {
      console.warn("Error formatting time:", timeStr, err);
      return timeStr || "";
    }
  };

  const itemsList = items ? (Array.isArray(items) ? items : Object.values(items)) : [];

  // 3. Effects
  useEffect(() => {
    const fetchNextSlots = async () => {
      setLoadingSlots(true);
      setError(null);
      try {
        // Use IST date logic consistent with Search.jsx
        const IST_TIMEZONE = 'Asia/Kolkata';
        const getISTDate = () => new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));

        const today = getISTDate();
        const datesToCheck = [];

        // Generate Today and next 2 days (Total 3 days consistent with Navbar)
        for (let i = 0; i < 3; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);

          // Format manually to YYYY-MM-DD to avoid UTC conversion issues
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          datesToCheck.push(`${year}-${month}-${day}`);
        }

        // Set initial active date
        if (!activeDate || !datesToCheck.includes(activeDate)) {
          setActiveDate(datesToCheck[0]);
        }

        const allValidSlots = [];

        // Fetch slots for each day
        for (const dateStr of datesToCheck) {
          const res = await fetch(`${API_URL}/api/slots/availability?date=${dateStr}`);
          const data = await res.json();

          if (Array.isArray(data)) {
            const openSlots = data.filter(s => s.isAvailable);
            if (openSlots.length === 0) continue;

            // OPTIMIZATION: Fetch product blocked slots for this day once, instead of per slot
            const dateObj = new Date(dateStr);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeekName = days[dateObj.getDay()];

            // Get distinct product IDs
            const uniqueProductIds = [...new Set(itemsList.map(item => item.product?._id || item._id || item.productId).filter(Boolean))];

            // Fetch restrictions for all products in parallel
            const productRestrictions = await Promise.all(uniqueProductIds.map(async (pid) => {
              try {
                const r = await fetch(`${API_URL}/api/product-slot-availability/check/${pid}/${dayOfWeekName}`);
                const rData = await r.json();
                if (rData.success && Array.isArray(rData.unavailableSlots)) {
                  return rData.unavailableSlots;
                }
              } catch (e) { console.error("Error fetching restrictions", e); }
              return [];
            }));

            // Collect all blocked slot names for this cart on this day
            const blockedSlotNames = new Set();
            productRestrictions.forEach(slots => {
              slots.forEach(s => {
                if (s) blockedSlotNames.add(s.trim());
              });
            });

            // Filter compatible slots
            const validDaySlots = openSlots.filter(slot => {
              const cleanName = slot.name.split('(')[0].trim();
              return !blockedSlotNames.has(cleanName);
            }).map(s => ({
              ...s,
              date: dateStr
            }));

            allValidSlots.push(...validDaySlots);
          }
        }

        setAvailableSlots(allValidSlots);
      } catch (err) {
        console.error("Error fetching slots", err);
        setError("Could not load alternative slots.");
      } finally {
        setLoadingSlots(false);
      }
    };

    if (isOpen) {
      fetchNextSlots();
    }
  }, [isOpen]);

  const handleSelectSlot = (slot) => {
    // Construct the slot object expected by AppContext
    const newSlot = {
      date: slot.date,
      timeSlot: `${slot.name} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`,
      slotId: slot._id
    };

    // Pass manualSelection=true to prevent auto-upgrade to today's slot
    validateAndSetSlot(newSlot, true);
    onClose(); // Close modal, new validation will run naturally or user continues
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header - Warning Style */}
              <div className="p-5 border-b border-amber-100 bg-amber-50 flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600 flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    These items are not available for your selected time.
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    We recommend switching to an available slot below:
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50">

                {/* Slot Selector Section */}
                <div className="p-5 pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarClock size={16} className="text-blue-600" />
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Available Alternative Slots
                    </h4>
                  </div>

                  {loadingSlots ? (
                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                  ) : availableSlots.length > 0 ? (
                    <div className="space-y-4">
                      {/* Date Tabs */}
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        {[...new Set(availableSlots.map(s => s.date))].sort().map((dateStr, idx) => {
                          const dateObj = new Date(dateStr);
                          const todayStr = new Date().toISOString().split('T')[0];
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const tomorrowStr = tomorrow.toISOString().split('T')[0];

                          let label = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                          if (dateStr === todayStr) label = "Today";
                          else if (dateStr === tomorrowStr) label = "Tomorrow";

                          const isActive = activeDate === dateStr;

                          return (
                            <button
                              key={dateStr}
                              onClick={() => setActiveDate(dateStr)}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive
                                ? 'bg-white text-blue-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Slots List for Active Date */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableSlots.filter(s => s.date === activeDate).length > 0 ? (
                          availableSlots.filter(s => s.date === activeDate).map(slot => (
                            <button
                              key={slot._id}
                              onClick={() => handleSelectSlot(slot)}
                              className="w-full bg-white hover:bg-emerald-50 border border-gray-100 border-b-2 hover:border-emerald-300 p-4 rounded-2xl text-left transition-all group flex items-center justify-between relative overflow-hidden active:translate-y-0.5"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-emerald-500 transition-colors"></div>
                              <div>
                                <span className="block text-sm font-black text-gray-800 group-hover:text-emerald-900">
                                  {slot.name}
                                </span>
                                <span className="block text-[10px] text-gray-400 group-hover:text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </span>
                              </div>
                              <div className="bg-gray-50 group-hover:bg-emerald-500 text-gray-400 group-hover:text-white p-2 rounded-xl transition-all group-hover:scale-110">
                                <ArrowRight size={16} strokeWidth={3} />
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No slots available for this date.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic py-2">No alternative slots found.</p>
                  )}
                </div>

                {/* Conflicting Items List */}
                <div className="p-5 pt-2">
                  <div className="flex items-center gap-2 mb-3 mt-4">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                      Conflicting Items ({itemsList.length})
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {itemsList.map((item, index) => (
                      <div key={item.cartKey || index} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 opacity-75">
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
                          <img
                            src={item?.image || item?.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                            alt={item?.name || 'Item'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-xs">{item?.name || 'Unknown Item'}</h4>
                          {item?.reason && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 inline-block mt-0.5">
                              {item.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 border-t border-gray-100 bg-white flex flex-col gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">OR</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                {/* Secondary Action: Remove Items */}
                <button
                  onClick={onRemove}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Keep Current Slot & Remove Items
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence >
  );
};

export default UnavailableItemsModal;
