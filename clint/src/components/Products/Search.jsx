import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Search as SearchIcon, X, ChevronRight, Truck, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

/* -------------------------------
   IST Timezone Utilities (Consistent with Cart)
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

export default function Search({ mobile = false }) {
  const { products, selectedSlot, setSelectedSlot, API_URL } = useAppContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!mobile); // Default expanded on desktop

  // Slot Picker State
  const [isSlotPickerOpen, setIsSlotPickerOpen] = useState(false);

  // New State for 3 Days
  const [dateTabs, setDateTabs] = useState([]);
  const [slotData, setSlotData] = useState({}); // Keyed by date string
  const [activeDate, setActiveDate] = useState(''); // Holds the YYYY-MM-DD string
  const [loadingSlots, setLoadingSlots] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef(null);

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category?.trim()).filter(Boolean))
  ).map((name) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    icon: getCategoryIcon(name),
  }));

  function getCategoryIcon(name) {
    const iconMap = {
      Fruits: "🍎",
      Vegetables: "🥦",
      Dairy: "🥛",
      Bakery: "🍞",
      Beverages: "🥤",
      Snacks: "🍿",
      Meat: "🥩",
      Seafood: "🐟",
      Grains: "🌾",
      Frozen: "🧊",
      Household: "🏠",
      Spices: "🌶️",
      Seeds: "🌱",
      Instant: "⚡",
      Others: "📦",
    };
    return iconMap[name] || "📦";
  }

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
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults([]);
        setIsFocused(false);
        setIsSlotPickerOpen(false);
        // On mobile, collapse if query is empty and click outside
        if (mobile && !query) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobile, query]);

  // Initialize Dates and Fetch Slots
  useEffect(() => {
    if (isSlotPickerOpen) {
      initializeDatesAndFetch();
    }
  }, [isSlotPickerOpen]);

  const initializeDatesAndFetch = async () => {
    setLoadingSlots(true);
    try {
      const tabs = [];
      const today = getISTDate();
      const fetchPromises = [];

      // Generate next 3 days
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = getISTDateString(date);

        let label = "";
        if (i === 0) label = "Today";
        else if (i === 1) label = "Tomorrow";
        else {
          // E.g., "Mon 20"
          label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        }

        tabs.push({
          date: dateStr,
          label: label
        });

        fetchPromises.push(fetch(`${API_URL}/api/slots/availability?date=${dateStr}`));
      }

      setDateTabs(tabs);

      // Fetch all slots
      const responses = await Promise.all(fetchPromises);
      const data = await Promise.all(responses.map(res => res.json()));

      const newSlotData = {};
      let firstAvailableDate = null;

      tabs.forEach((tab, index) => {
        const slots = Array.isArray(data[index]) ? data[index].filter(s => s.isAvailable) : [];
        newSlotData[tab.date] = slots;

        // Identify first date with usage slots
        if (!firstAvailableDate && slots.length > 0) {
          firstAvailableDate = tab.date;
        }
      });

      setSlotData(newSlotData);

      // Smart Tab Selection:
      // 1. If user has a selected slot in one of these days, switch to that tab.
      // 2. Else, default to the first day with available slots.
      // 3. Fallback to Tomorrow (index 1) if Today is empty.

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
      setLoadingSlots(false);
    }
  };


  const handleSelectSlot = (slot, dateStr) => {
    const newSlot = {
      date: dateStr,
      timeSlot: `${slot.name} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`,
      slotId: slot._id
    };

    setSelectedSlot(newSlot);
    setIsSlotPickerOpen(false);
    toast.success(`Slot updated to ${slot.name}`);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setQuery(value);

    if (!value) {
      setResults([]);
      return;
    }

    const categoryMatches = uniqueCategories.filter((cat) =>
      cat.name.toLowerCase().includes(value)
    );

    const productMatches = products.filter((prod) =>
      prod.name.toLowerCase().includes(value)
    );

    const combined = [
      ...categoryMatches.map((c) => ({
        type: "Category",
        label: c.name,
        icon: c.icon,
        href: `/products/${c.slug}`,
      })),
      ...productMatches.map((p) => ({
        type: "Product",
        label: p.name,
        icon: p.images?.[0] ? p.images[0] : null,
        href: `/products/${p.category?.toLowerCase()}/${p._id}`,
        price: p.weights?.[0]?.offerPrice || p.weights?.[0]?.price || 0,
      })),
    ].slice(0, 8);

    setResults(combined);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    if (mobile) setIsExpanded(false); // Collapse on clear/close in mobile
  };

  const handleResultClick = (href) => {
    navigate(href);
    setQuery("");
    setResults([]);
    setIsFocused(false);
    if (mobile) setIsExpanded(false);
  };

  // Format slot for display
  const getSlotDisplay = () => {
    if (!selectedSlot || !selectedSlot.date || !selectedSlot.timeSlot) {
      return "Select Delivery Slot";
    }

    // Parse Date safely
    const dateObj = new Date(selectedSlot.date);
    if (isNaN(dateObj)) return "Select Delivery Slot";

    const todayStr = getISTDateString(getISTDate());
    const tomorrow = new Date(getISTDate());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = getISTDateString(tomorrow);

    let dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    if (selectedSlot.date === todayStr) dayStr = "Today";
    else if (selectedSlot.date === tomorrowStr) dayStr = "Tomorrow";

    // Extract brief time
    const briefTime = selectedSlot.timeSlot.split('(')[0].trim();

    return `${dayStr}, ${briefTime}`;
  };

  return (
    <div
      ref={searchRef}
      className={`relative ${mobile ? "w-full px-0" : "w-full max-w-2xl mx-auto"}`}
    >
      <AnimatePresence mode="wait">
        {!isExpanded && mobile ? (
          // COLLAPSED STATE (SLOT VIEW)
          <motion.div
            key="slot-bar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-full p-2 pr-2 shadow-sm relative z-50"
          >
            {/* Slot Info & Change Action */}
            <div
              className="flex-1 flex items-center gap-3 pl-2 overflow-hidden cursor-pointer"
              onClick={() => setIsSlotPickerOpen(!isSlotPickerOpen)}
            >
              <div className={`p-2 rounded-full shadow-sm flex-shrink-0 transition-colors ${isSlotPickerOpen ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600'}`}>
                {isSlotPickerOpen ? <X size={16} /> : <Truck size={16} />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider leading-none mb-0.5">
                  {isSlotPickerOpen ? "Select a Slot" : "Delivery Slot"}
                </span>
                <span className="text-xs font-bold text-gray-800 truncate leading-none pt-0.5">
                  {isSlotPickerOpen ? "Tap to close" : getSlotDisplay()}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-emerald-200 mx-2"></div>

            {/* Search Trigger */}
            <button
              onClick={() => {
                setIsSlotPickerOpen(false);
                setIsExpanded(true);
                setTimeout(() => document.getElementById("mobile-search-input")?.focus(), 500);
              }}
              className="bg-white text-gray-500 hover:text-emerald-600 flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition-colors"
            >
              <SearchIcon size={16} />
              <span className="text-xs font-medium">Search</span>
            </button>

            {/* --- SLOT PICKER DROPDOWN --- */}
            <AnimatePresence>
              {isSlotPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[60]"
                >
                  {/* Date Tabs */}
                  {dateTabs.length > 0 && (
                    <div className="flex bg-gray-50 border-b border-gray-100 p-1">
                      {dateTabs.map((tab) => (
                        <button
                          key={tab.date}
                          onClick={() => setActiveDate(tab.date)}
                          className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all truncate ${activeDate === tab.date
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-3 max-h-60 overflow-y-auto">
                    {loadingSlots ? (
                      <div className="flex justify-center py-8 text-emerald-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeDate && slotData[activeDate] && slotData[activeDate].length > 0 ? (
                          slotData[activeDate].map((slot) => {
                            const isSelected = selectedSlot?.timeSlot?.startsWith(slot.name) && selectedSlot?.date === activeDate;

                            return (
                              <button
                                key={slot._id}
                                onClick={() => handleSelectSlot(slot, activeDate)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                                  ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                  : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
                                  }`}
                              >
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} className={isSelected ? "text-emerald-600" : "text-gray-400"} />
                                    <span className={`text-sm font-bold ${isSelected ? 'text-emerald-800' : 'text-gray-700'}`}>
                                      {slot.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-500 ml-5.5 block">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </span>
                                </div>
                                {isSelected && <CheckCircle2 size={18} className="text-emerald-600" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-xs">
                            No slots available for {dateTabs.find(t => t.date === activeDate)?.label || 'this date'}.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // EXPANDED STATE (SEARCH INPUT)
          <motion.div
            key="search-bar"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`relative flex items-center ${mobile
              ? "bg-white border border-gray-300 shadow-lg rounded-full"
              : "bg-white border border-gray-500 shadow-lg rounded-full"
              }`}
          >
            {/* Search Icon */}
            <div
              className={`absolute inset-y-0 left-0 flex items-center ${mobile ? "pl-4" : "pl-5"
                } ${isFocused ? "text-emerald-600" : "text-gray-400"}`}
            >
              <SearchIcon className={mobile ? "w-4 h-4" : "w-5 h-5"} />
            </div>

            {/* Input */}
            <input
              id={mobile ? "mobile-search-input" : "desktop-search-input"}
              autoFocus={mobile}
              placeholder="Search products & categories"
              value={query}
              onChange={handleSearch}
              onFocus={() => setIsFocused(true)}
              className={`w-full bg-transparent focus:outline-none placeholder-gray-400 rounded-full ${mobile ? "py-3.5 pl-10 pr-12 text-sm" : "py-4 pl-12 pr-12 text-lg"
                }`}
              type="text"
            />

            {/* Clear/Close Button */}
            <button
              onClick={clearSearch}
              className={`absolute inset-y-0 right-0 flex items-center ${mobile ? "pr-4" : "pr-5"
                } text-gray-400 hover:text-gray-600`}
            >
              {query ? <X size={18} /> : (mobile && <X size={18} />)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dropdown - Keep outside AnimatePresence so it doesn't flicker when switching modes improperly, though mode switching logic is above */}
      {isFocused && results.length > 0 && (
        <div
          className={`absolute mt-3 bg-white border border-emerald-100 rounded-2xl shadow-2xl z-50 overflow-hidden ${mobile ? "left-0 right-0" : "w-full"
            }`}
        >
          <div className="p-3 border-b border-emerald-50 bg-gradient-to-r from-emerald-50 to-teal-50">
            <p className="text-sm font-semibold text-emerald-800">
              Found {results.length} results
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleResultClick(item.href)}
                className="p-4 cursor-pointer border-b border-emerald-50 last:border-b-0 hover:bg-emerald-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-emerald-100">
                      {item.type === "Category" ? (
                        <span className="text-lg">{item.icon}</span>
                      ) : item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-300 text-xl">📦</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">{item.label}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === 'Category' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.type === 'Category' ? 'CAT' : 'PROD'}
                        </span>
                      </div>
                      {item.price ? (
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">₹{item.price}</p>
                      ) : (
                        <p className="text-[10px] text-gray-400 mt-0.5">Browse Category</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-1.5 rounded-full text-gray-400">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {isFocused && query && results.length === 0 && (
        <div
          className={`absolute mt-3 bg-white border border-emerald-100 rounded-2xl shadow-2xl z-50 p-6 text-center ${mobile ? "left-0 right-0" : "w-full"
            }`}
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <SearchIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No results found</h3>
          <p className="text-sm text-gray-600">
            Try searching for different keywords or browse categories
          </p>
        </div>
      )}
    </div>
  );
}