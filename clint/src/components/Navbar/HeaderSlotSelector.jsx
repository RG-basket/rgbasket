import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, X, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function HeaderSlotSelector() {
  const { selectedSlot, validateAndSetSlot, API_URL, isNonVegTheme } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [dateTabs, setDateTabs] = useState([]);
  const [slotData, setSlotData] = useState({});
  const [activeDate, setActiveDate] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  // Format time to 12hr AM/PM
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
      return timeStr || "";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initializeDatesAndFetch();
    }
  }, [isOpen]);

  const initializeDatesAndFetch = async () => {
    setLoading(true);
    try {
      const tabs = [];
      const today = getISTDate();
      const fetchPromises = [];

      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = getISTDateString(date);

        let label = "";
        if (i === 0) label = "Today";
        else if (i === 1) label = "Tomorrow";
        else {
          label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        }

        tabs.push({ date: dateStr, label: label });
        fetchPromises.push(fetch(`${API_URL}/api/slots/availability?date=${dateStr}`));
      }

      setDateTabs(tabs);

      const responses = await Promise.all(fetchPromises);
      const data = await Promise.all(responses.map(res => res.json()));

      const newSlotData = {};
      let firstAvailableDate = null;

      tabs.forEach((tab, index) => {
        const slots = Array.isArray(data[index]) ? data[index].filter(s => s.isAvailable) : [];
        newSlotData[tab.date] = slots;

        if (!firstAvailableDate && slots.length > 0) {
          firstAvailableDate = tab.date;
        }
      });

      setSlotData(newSlotData);

      let targetDate = tabs[1].date; // Default to Tomorrow
      if (selectedSlot && selectedSlot.date) {
        const isKnownDate = tabs.some(t => t.date === selectedSlot.date);
        if (isKnownDate) {
          targetDate = selectedSlot.date;
        } else if (firstAvailableDate) {
          targetDate = firstAvailableDate;
        }
      } else if (firstAvailableDate) {
        targetDate = firstAvailableDate;
      }

      setActiveDate(targetDate);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Could not load delivery slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot, dateStr) => {
    const newSlot = {
      date: dateStr,
      timeSlot: `${slot.name} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`,
      slotId: slot._id
    };

    validateAndSetSlot(newSlot, true);
    setIsOpen(false);
    toast.success(`Slot updated to ${slot.name}`);
  };

  const getSlotDisplay = () => {
    if (!selectedSlot || !selectedSlot.date || !selectedSlot.timeSlot) {
      return "Select Slot";
    }

    const dateObj = new Date(selectedSlot.date);
    if (isNaN(dateObj)) return "Select Slot";

    const todayStr = getISTDateString(getISTDate());
    const tomorrow = new Date(getISTDate());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getISTDateString(tomorrow);

    let dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    if (selectedSlot.date === todayStr) dayStr = "Today";
    else if (selectedSlot.date === tomorrowStr) dayStr = "Tomorrow";

    const briefTime = selectedSlot.timeSlot.split('(')[0].trim();
    return `${dayStr}, ${briefTime}`;
  };

  const themeColor = isNonVegTheme ? 'text-red-600 bg-red-50 border-red-200' : 'text-[#26544a] bg-emerald-50 border-emerald-200';
  const dotColor = isNonVegTheme ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Slot trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 ${themeColor}`}
      >
        <CalendarClock size={15} />
        <div className="flex flex-col items-start leading-none text-left">
          <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Delivering to</span>
          <span className="text-[11px] font-bold text-gray-800 tracking-tight">{getSlotDisplay()}</span>
        </div>
        <ChevronDown size={12} className="text-gray-400 group-hover:text-gray-600 ml-0.5 transition-transform duration-200" />
      </button>

      {/* Dropdown Slot Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700">Select Delivery Slot</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>

            {/* Date Tabs */}
            {dateTabs.length > 0 && (
              <div className="flex bg-gray-50/50 border-b border-gray-100 p-1">
                {dateTabs.map((tab) => (
                  <button
                    key={tab.date}
                    onClick={() => setActiveDate(tab.date)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all truncate ${activeDate === tab.date
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-50'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Slots list */}
            <div className="p-2 max-h-52 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-6 text-emerald-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeDate && slotData[activeDate] && slotData[activeDate].length > 0 ? (
                    slotData[activeDate].map((slot) => {
                      const isSelected = selectedSlot?.timeSlot?.startsWith(slot.name) && selectedSlot?.date === activeDate;

                      return (
                        <button
                          key={slot._id}
                          onClick={() => handleSelectSlot(slot, activeDate)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${isSelected
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-white border-gray-50 hover:border-emerald-100 hover:bg-gray-50/50'
                            }`}
                        >
                          <div className="text-left flex items-center gap-2">
                            <Clock size={13} className={isSelected ? "text-emerald-600" : "text-gray-400"} />
                            <div>
                              <span className={`text-[12px] font-bold block ${isSelected ? 'text-emerald-800' : 'text-gray-700'}`}>
                                {slot.name}
                              </span>
                              <span className="text-[9px] text-gray-500 block mt-0.5">
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                              </span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 size={15} className="text-emerald-600" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-[11px]">
                      No slots available for this date.
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
