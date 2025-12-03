import { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api/slots`;

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

const SlotSelector = ({ onSlotChange }) => {
  const {
    selectedSlot,
    setSelectedSlot,
    validateCartForSlot,
    toast
  } = useAppContext();

  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use IST for date generation
  const today = getISTDate();
  const allowedDates = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return getISTDateString(d); // Use IST date string
  });

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        // Always fetch fresh slot data (no caching for time-sensitive availability)
        console.log('🔄 Fetching fresh slots');
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setSlots(data);

        if (!date && allowedDates.length > 0 && data.length > 0) {
          const firstDate = allowedDates[0];
          setDate(firstDate);
        }
      } catch (err) {
        console.error("Error:", err.message);
        setSlots([]);
      }
    };
    fetchSlots();
  }, []);

  useEffect(() => {
    if (selectedSlot) {
      if (selectedSlot.date && selectedSlot.date !== date) {
        setDate(selectedSlot.date);
      }
      if (selectedSlot.timeSlot && selectedSlot.timeSlot !== timeSlot) {
        setTimeSlot(selectedSlot.timeSlot);
        setSelectedSlotId(selectedSlot.slotId || "");
      }
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (date) {
      // Add small delay to prevent burst requests (debounce)
      const timer = setTimeout(() => {
        fetchAvailability(date);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [date]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const fetchAvailability = async (selectedDate) => {
    if (!selectedDate) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/availability?date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      if (selectedDate === date) {
        setAvailability(data);

        const currentSlot = selectedSlotId ? data.find(s => s._id === selectedSlotId) : null;
        const isInvalid = currentSlot && !currentSlot.isAvailable;

        if ((!selectedSlotId || isInvalid) && data.length > 0) {
          const firstAvailable = data.find(s => s.isAvailable);

          if (firstAvailable) {
            setSelectedSlotId(firstAvailable._id);
            const s = formatTime(firstAvailable.startTime);
            const e = formatTime(firstAvailable.endTime);
            setTimeSlot(`${firstAvailable.name} (${s} - ${e})`);
          } else {
            const idx = allowedDates.indexOf(selectedDate);
            if (idx < allowedDates.length - 1) {
              setDate(allowedDates[idx + 1]);
              setSelectedSlotId("");
              setTimeSlot("");
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = async (slot) => {
    if (!slot.isAvailable) {
      toast?.error("Unavailable slot");
      return;
    }

    const start = formatTime(slot.startTime);
    const end = formatTime(slot.endTime);
    const label = `${slot.name} (${start} - ${end})`;

    setTimeSlot(label);
    setSelectedSlotId(slot._id);

    if (validateCartForSlot) {
      await validateCartForSlot({
        date: date,
        timeSlot: label,
        slotId: slot._id
      });
    }
  };

  const handleConfirm = async () => {
    if (!date || !selectedSlotId) return;
    const s = availability.find(x => x._id === selectedSlotId);
    if (!s?.isAvailable) {
      toast?.error("Slot not available");
      return;
    }

    const start = formatTime(s.startTime);
    const end = formatTime(s.endTime);
    const label = `${s.name} (${start} - ${end})`;

    const slotData = { date, timeSlot: label, slotId: selectedSlotId };

    await setSelectedSlot?.(slotData);
    onSlotChange?.(slotData);

    setOpen(false);
  };

  const getDisplayText = () => {
    if (!date || !timeSlot) return "Select Delivery Slot";
    const d = new Date(date);
    return `Slot: ${d.toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short"
    })} ${timeSlot.split(" (")[0]}`;
  };

  return (
    <div className="w-full">
      {/* ---------- BIG ANIMATED SLOT BUTTON ---------- */}
      <button
        onClick={() => setOpen(true)}
        className="
          w-full py-3 px-4
          rounded-xl text-base font-semibold
          bg-gradient-to-r from-emerald-100 to-emerald-50
          text-[#26544a]
          shadow-sm
          transition-all duration-300
          hover:shadow-lg hover:scale-[1.02]
        "
      >
        {getDisplayText()}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[92%] max-w-md animate-[fadeIn_0.25s_ease]">

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Delivery Slot
            </h2>

            {/* DAY SELECT */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Select Day</h3>

              <div className="flex gap-2">
                {allowedDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDate(d); setSelectedSlotId(""); setTimeSlot(""); }}
                    className={`
                      px-3 py-2 rounded-lg text-sm border transition
                      ${date === d
                        ? "bg-[#26544a] text-white border-[#26544a] scale-[1.03]"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }
                    `}
                  >
                    {new Date(d).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </button>
                ))}
              </div>
            </div>

            {/* TIME SLOT SELECT */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Select Time Slot {loading && "(Checking...)"}
              </h3>

              <div className="flex flex-col gap-2">
                {availability.map((slot) => {
                  const s = formatTime(slot.startTime);
                  const e = formatTime(slot.endTime);
                  const label = `${slot.name} (${s} - ${e})`;
                  const isSelected = timeSlot === label;

                  return (
                    <button
                      key={slot._id}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!slot.isAvailable}
                      className={`
                        px-3 py-3 rounded-lg text-sm border transition-all text-left
                        ${isSelected
                          ? "bg-[#26544a] text-white border-[#26544a] shadow-md scale-[1.02]"
                          : slot.isAvailable
                            ? "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                            : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                        }
                      `}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{slot.name}</span>
                        <span className="text-xs">{s} - {e}</span>
                      </div>

                      {!slot.isAvailable && (
                        <p className="text-xs text-red-500 mt-1">
                          {slot.reason.includes("cutoff") ? "Booking closed" : slot.reason}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!date || !selectedSlotId}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition
                  ${date && selectedSlotId
                    ? "bg-[#26544a] text-white hover:bg-[#1e433b]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                Confirm Slot
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SlotSelector;
