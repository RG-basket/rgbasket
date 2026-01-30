import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { auth, provider } from '../Firebase.js';
import { signInWithPopup, signOut } from 'firebase/auth';

/* -------------------------------
   IST Timezone Utilities
--------------------------------- */
const IST_TIMEZONE = 'Asia/Kolkata';

// Get current date/time in IST
const getISTDate = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
};

// Get IST date string in YYYY-MM-DD format
const getISTDateString = (date = null) => {
  const d = date || new Date();
  const istDate = new Date(d.toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse a date string (YYYY-MM-DD) as IST midnight
const parseISTDate = (dateString) => {
  return new Date(dateString + 'T00:00:00+05:30');
};

const API_URL = import.meta.env.VITE_API_URL;
const CURRENCY = '₹';
const POLLING_INTERVAL = 300000; // 5 minutes (increased from 30 seconds to reduce server load)
const CACHE_DURATION = 3600000; // 1 hour cache for categories and slots

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  // Auth State
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);

  // Products State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Cart State
  const [cartItems, setCartItems] = useState({});
  const [recentItems, setRecentItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [limitPopup, setLimitPopup] = useState(null); // { productName, limit, unit }
  const [limitTimeout, setLimitTimeout] = useState(null);
  const [customizationData, setCustomizationData] = useState({}); // { [itemKey]: { isCustomized: boolean, instructions: string } }

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Slot State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null);
  const [slotInitialized, setSlotInitialized] = useState(false);
  const [userManuallySelectedSlot, setUserManuallySelectedSlot] = useState(false); // Track manual selection

  // Cache State
  const [categoriesCache, setCategoriesCache] = useState(null);
  const [slotsCache, setSlotsCache] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);

  // Helper: Format time to 12hr AM/PM (Consistent with Search.jsx)
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

  // Helper: Get day of week from date string
  const getDayOfWeek = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Helper: Check if cache is valid
  const isCacheValid = (cacheData) => {
    if (!cacheData || !cacheData.timestamp) return false;
    const now = Date.now();
    return (now - cacheData.timestamp) < CACHE_DURATION;
  };

  // Helper: Get cached data or fetch new
  const getCachedOrFetch = async (cacheKey, fetchFn) => {
    try {
      // Check localStorage cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (isCacheValid(parsedCache)) {
          console.log(`✅ Using cached ${cacheKey}`);
          return parsedCache.data;
        }
      }

      // Cache miss or expired, fetch new data
      console.log(`🔄 Fetching fresh ${cacheKey}`);
      const data = await fetchFn();

      // Store in cache with timestamp
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      return data;
    } catch (error) {
      console.error(`Error in getCachedOrFetch for ${cacheKey}:`, error);
      return null;
    }
  };

  // ===== SLOT AUTO-SELECTION =====
  const findNearestAvailableSlot = async () => {
    try {
      const todayStr = getISTDateString();
      const tomorrowStr = getISTDateString(new Date(getISTDate().getTime() + 86400000));

      const getSortedAvailable = (data) => {
        if (!Array.isArray(data)) return [];
        return data
          .filter(s => s.isAvailable)
          .sort((a, b) => {
            const timeA = parseInt(a.startTime.replace(':', ''));
            const timeB = parseInt(b.startTime.replace(':', ''));
            return timeA - timeB;
          });
      };

      // 1. ALWAYS Try TODAY first
      const resToday = await axios.get(`${API_URL}/api/slots/availability?date=${todayStr}`);
      const availableToday = getSortedAvailable(resToday.data);

      if (availableToday.length > 0) {
        const slot = availableToday[0];
        console.log('📍 [SlotSelection] Found available slot today:', slot.name);
        return {
          date: todayStr,
          timeSlot: `${slot.name} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`,
          slotId: slot._id
        };
      }

      // 2. Try TOMORROW if Today is fully booked or cut off
      console.log('📍 [SlotSelection] No slots today, checking tomorrow...');
      const resTom = await axios.get(`${API_URL}/api/slots/availability?date=${tomorrowStr}`);
      const availableTom = getSortedAvailable(resTom.data);

      if (availableTom.length > 0) {
        const slot = availableTom[0];
        return {
          date: tomorrowStr,
          timeSlot: `${slot.name} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})`,
          slotId: slot._id
        };
      }

      // 3. Last Fallback: Hardcoded Default
      return {
        date: tomorrowStr,
        timeSlot: 'Morning (7:00 AM - 10:00 AM)',
        slotId: 'default-morning-slot'
      };

    } catch (error) {
      console.error('📍 [SlotSelection] Error:', error.message);
      const tomorrowStr = getISTDateString(new Date(getISTDate().getTime() + 86400000));
      return {
        date: tomorrowStr,
        timeSlot: 'Morning (7:00 AM - 10:00 AM)',
        slotId: 'default-morning-slot'
      };
    }
  };

  useEffect(() => {
    loadAuthState();
    loadCartState();
    loadSlotState().catch(err => {
      console.error('Error loading slot state on mount:', err);
    });

    // RE-VERIFY BAN STATUS when user brings tab back to focus
    // Optimized Ban Check: Don't ping server more than once every 2 minutes
    const throttledCheck = () => {
      const lastCheck = localStorage.getItem('lastBanCheck');
      const now = Date.now();
      const TWO_MINUTES = 2 * 60 * 1000;

      // Only check if never checked, or 2 mins passed, or user is already banned in local state
      if (!lastCheck || (now - parseInt(lastCheck)) > TWO_MINUTES || JSON.parse(localStorage.getItem('user'))?.isBanned) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          checkUserStatus(userData.id || userData._id);
          localStorage.setItem('lastBanCheck', now.toString());
        }
      }
    };

    window.addEventListener('focus', throttledCheck);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') throttledCheck();
    });

    return () => {
      window.removeEventListener('focus', throttledCheck);
      document.removeEventListener('visibilitychange', throttledCheck);
    };
  }, []);

  const checkUserStatus = async (userId) => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API_URL}/api/users/${userId}`);
      if (response.data.success) {
        const updatedUser = {
          ...response.data.user,
          id: response.data.user._id
        };

        // Only update state if something actually changed to avoid re-renders
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (JSON.stringify(currentUser) !== JSON.stringify(updatedUser)) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        if (updatedUser.isBanned) {
          console.warn('🛑 User is currently banned');
        }
      }
    } catch (error) {
      if (error.response?.status === 404) {
        logout();
      }
      console.error('Error checking user status:', error);
    }
  };

  const loadAuthState = () => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedAuth = localStorage.getItem('isLoggedIn');

      if (savedUser && savedAuth === 'true') {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);

        // IMMEDIATE CHECK: If the local cache says they are banned, keep them blocked
        if (userData.isBanned === true) {
          console.log('User is banned (from local storage)');
        }

        // Verify fresh ban status from server in background
        checkUserStatus(userData.id || userData._id || userData.googleId);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
    }
  };

  const loadCartState = () => {
    try {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      const savedCustomization = localStorage.getItem('customizationData');
      if (savedCustomization) {
        setCustomizationData(JSON.parse(savedCustomization));
      }
    } catch (error) {
      console.error('Error loading cart state:', error);
      localStorage.removeItem('cartItems');
      localStorage.removeItem('customizationData');
    }
  };

  // Validate if a saved slot is still valid (not expired) - IST aware
  const validateSavedSlot = async (slot) => {
    if (!slot || !slot.date || !slot.timeSlot) {
      return { valid: false, reason: 'Invalid slot data' };
    }

    try {
      // Check if the slot date has passed (using IST)
      const slotDate = parseISTDate(slot.date);
      slotDate.setHours(0, 0, 0, 0);

      const today = getISTDate();
      today.setHours(0, 0, 0, 0);

      // If slot date is in the past, it's invalid
      if (slotDate < today) {
        return { valid: false, reason: 'Slot date has passed' };
      }

      // For today's date, check if the slot cutoff has passed
      if (slotDate.getTime() === today.getTime()) {
        // Fetch availability for today to check if slot is still available
        const response = await axios.get(`${API_URL}/api/slots/availability?date=${slot.date}`);

        if (Array.isArray(response.data)) {
          const slotInfo = response.data.find(s => s._id === slot.slotId);

          if (slotInfo && !slotInfo.isAvailable) {
            return { valid: false, reason: slotInfo.reason || 'Slot no longer available' };
          }
        }
      }

      // Slot is valid
      return { valid: true };
    } catch (error) {
      console.error('Error validating slot:', error);
      // On error, assume slot might be invalid and let it through
      // (better to show potentially valid slot than force re-selection)
      return { valid: true };
    }
  };

  const loadSlotState = async () => {
    try {
      const savedSlotStr = localStorage.getItem('selectedSlot');
      const manualSelectionFlag = localStorage.getItem('userManuallySelectedSlot') === 'true';
      const todayStr = getISTDateString();

      // Set the manual selection flag from localStorage
      setUserManuallySelectedSlot(manualSelectionFlag);

      // Case 1: No saved slot OR saved slot is in the past -> Full auto-select
      if (!savedSlotStr || savedSlotStr === 'undefined' || savedSlotStr === 'null') {
        console.log('📍 [loadSlotState] No valid saved slot. Auto-selecting nearest...');
        const nearest = await findNearestAvailableSlot();
        if (nearest) {
          setSelectedSlot(nearest);
          localStorage.setItem('selectedSlot', JSON.stringify(nearest));
          // This is auto-selection, not manual
          setUserManuallySelectedSlot(false);
          localStorage.setItem('userManuallySelectedSlot', 'false');
        }
        return;
      }

      let slot;
      try {
        slot = JSON.parse(savedSlotStr);
      } catch (e) {
        console.warn('📍 [loadSlotState] Corrupt slot in localStorage, resetting...');
        const nearest = await findNearestAvailableSlot();
        if (nearest) {
          setSelectedSlot(nearest);
          localStorage.setItem('selectedSlot', JSON.stringify(nearest));
          setUserManuallySelectedSlot(false);
          localStorage.setItem('userManuallySelectedSlot', 'false');
        }
        return;
      }
      const validation = await validateSavedSlot(slot);

      // Case 2: Slot is valid but not for Today. 
      // ONLY auto-upgrade if user has NOT manually selected a slot
      if (validation.valid && slot.date !== todayStr && !manualSelectionFlag) {
        const nearest = await findNearestAvailableSlot();
        if (nearest && nearest.date === todayStr) {
          console.log('📍 [loadSlotState] Upgraded from future slot to Today.');
          setSelectedSlot(nearest);
          localStorage.setItem('selectedSlot', JSON.stringify(nearest));
          return;
        }
      }

      // Case 3: Slot is valid and already Today (or Today is unavailable, or user manually selected)
      if (validation.valid) {
        setSelectedSlot(slot);
        if (manualSelectionFlag) {
          console.log('📍 [loadSlotState] Respecting user manual slot selection');
        }
      } else {
        // Case 4: Expired or invalid -> Re-select
        console.log(`📍 [loadSlotState] Invalid/Expired (${validation.reason}). Re-selecting...`);
        const nearest = await findNearestAvailableSlot();
        if (nearest) {
          setSelectedSlot(nearest);
          localStorage.setItem('selectedSlot', JSON.stringify(nearest));
          // Reset manual flag since slot expired
          setUserManuallySelectedSlot(false);
          localStorage.setItem('userManuallySelectedSlot', 'false');
        }
      }
    } catch (error) {
      console.error('📍 [loadSlotState] Critical Error:', error);
      const nearest = await findNearestAvailableSlot();
      if (nearest) setSelectedSlot(nearest);
    } finally {
      setSlotInitialized(true);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userData = {
        googleId: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
      };

      const response = await axios.post(`${API_URL}/api/auth/google`, userData);
      const backendUser = response.data.user;

      const userProfile = {
        ...backendUser,
        id: backendUser._id, // for consistency with existing code
      };

      setUser(userProfile);
      setIsLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('isLoggedIn', 'true');

      setShowUserLogin(false);
      toast.success("Login successful");
      // Stay on current page (e.g. Cart, Checkout) instead of redirecting to Profile
      // navigate("/profile");
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error) => {
    console.error("Google login or server error:", error);

    if (error.response?.status >= 500) {
      const user = error.config.data ? JSON.parse(error.config.data) : {};
      const userProfile = {
        name: user.name,
        email: user.email,
        photo: user.photo,
        id: user.googleId,
      };

      setUser(userProfile);
      setIsLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('isLoggedIn', 'true');

      setShowUserLogin(false);
      toast.success("Login successful (offline mode)");
      // navigate("/profile");
    } else {
      toast.error("Google login failed");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      toast.success("Logged out");
      navigate("/");
    }
  };

  const updateUserProfile = async (userId, updatedData) => {
    try {
      // Use userId from argument, fallback to _id or id
      const targetId = userId || user?._id || user?.id;
      const response = await axios.put(`${API_URL}/api/users/${targetId}`, updatedData);
      if (response.data.success) {
        const updatedUser = {
          ...user,
          ...response.data.user,
          id: response.data.user._id || user.id
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, message: error.response?.data?.message || "Failed to update profile" };
    }
  };

  const requireAuth = () => {
    if (!user) {
      console.log('User not logged in, showing popup');
      setShowUserLogin(true);
      return false;
    }
    return true;
  };

  // ===== PRODUCTS MANAGEMENT =====
  const fetchProducts = async (showToast = false) => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/products`;

      // Apply slot filter if selected
      if (selectedSlot && selectedSlot.timeSlot) {
        // Extract slot name from "Morning (07:00 - 10:00)" format
        const slotName = selectedSlot.timeSlot.split(' (')[0];
        url += `?slot=${slotName}`;

        // Add dayOfWeek
        if (selectedDayOfWeek) {
          url += `&dayOfWeek=${selectedDayOfWeek}`;
        } else if (selectedSlot.date) {
          const day = getDayOfWeek(selectedSlot.date);
          url += `&dayOfWeek=${day}`;
        }
      }

      const response = await axios.get(url);

      if (response.data && (response.data.products || Array.isArray(response.data))) {
        const productsData = response.data.products || response.data;
        setProducts(productsData);
        setLastUpdated(new Date());
      }

      if (showToast) {
        toast.success('Products refreshed');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      if (showToast) toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    fetchProducts(true);
  };

  const startProductPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(() => {
      fetchProducts(false);
    }, POLLING_INTERVAL);

    setPollingInterval(interval);
  };

  const stopProductPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // ===== SERVICE AREAS =====
  const fetchServiceAreas = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/service-areas`);
      if (response.data.success) {
        setServiceAreas(response.data.serviceAreas || []);
      }
    } catch (error) {
      console.error('Error fetching service areas:', error);
    }
  };

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  // ===== SLOT MANAGEMENT =====
  const clearSlot = () => {
    setSelectedSlot(null);
    localStorage.removeItem('selectedSlot');
    toast.success('Delivery slot cleared');
  };

  const isSlotSelected = () => {
    return selectedSlot !== null;
  };

  const getFormattedSlot = () => {
    if (!selectedSlot) return null;
    return {
      date: selectedSlot.date,
      timeSlot: selectedSlot.timeSlot,
      dayOfWeek: selectedDayOfWeek,
      formatted: `${selectedDayOfWeek}, ${selectedSlot.date} • ${selectedSlot.timeSlot}`
    };
  };

  // Update dayOfWeek when slot changes
  useEffect(() => {
    if (selectedSlot?.date) {
      const dayOfWeek = getDayOfWeek(selectedSlot.date);
      setSelectedDayOfWeek(dayOfWeek);
    }
  }, [selectedSlot]);

  // Refetch products when slot changes (for manual changes)
  useEffect(() => {
    if (selectedSlot && slotInitialized) {
      fetchProducts();
    }
  }, [selectedSlot, slotInitialized]);

  const getProductById = (productId) => {
    return products.find(product => product._id === productId);
  };

  const getProductStockStatus = (productId, weightIndex = 0) => {
    const product = getProductById(productId);
    if (!product) return { inStock: false, stock: 0 };

    const weight = product.weights?.[weightIndex];
    return {
      inStock: weight?.inStock ?? product.inStock ?? false,
      stock: weight?.stock ?? product.stock ?? 0
    };
  };

  // Check if a product is available for the selected slot
  const checkProductAvailability = async (productId, date, slot) => {
    try {
      const dayOfWeek = getDayOfWeek(date);
      const slotName = slot.split(' (')[0]; // Extract slot name from "Morning (07:00 - 10:00)"

      const response = await axios.get(
        `${API_URL}/api/product-slot-availability/check/${productId}/${dayOfWeek}`
      );

      if (response.data.success) {
        const { available, unavailableSlots } = response.data;
        return {
          available: available || !unavailableSlots.includes(slotName),
          reason: response.data.reason || 'Unavailable for selected slot'
        };
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking product availability:', error);
      return { available: true }; // Default to available on error
    }
  };

  // Validate all cart items for a specific slot
  const validateCartForSlot = async (slot) => {
    if (!slot || !slot.date || !slot.timeSlot) {
      return { valid: true, unavailableItems: [] };
    }

    const cartItemsWithDetails = getCartItemsWithDetails();
    const unavailableItems = [];

    for (const item of cartItemsWithDetails) {
      const availability = await checkProductAvailability(
        item.product._id,
        slot.date,
        slot.timeSlot
      );

      if (!availability.available) {
        unavailableItems.push({
          ...item,
          unavailabilityReason: availability.reason
        });
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems
    };
  };

  // Find the next nearest available slot for a specific product
  const findNextAvailableSlotForProduct = async (productId) => {
    try {
      const today = getISTDate();
      // Check next 7 days for availability
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateStr = getISTDateString(checkDate);
        const dayOfWeek = getDayOfWeek(dateStr);

        // 1. Get all slots availability for this date
        const resSlots = await axios.get(`${API_URL}/api/slots/availability?date=${dateStr}`);
        const availableSlots = Array.isArray(resSlots.data) ? resSlots.data.filter(s => s.isAvailable) : [];

        if (availableSlots.length === 0) continue;

        // 2. Get product restrictions for this day of week
        const resRestr = await axios.get(`${API_URL}/api/product-slot-availability/check/${productId}/${dayOfWeek}`);
        const unavailableSlotNames = resRestr.data.unavailableSlots || [];

        // 3. Find first available slot that doesn't have a product restriction
        const firstMatchingSlot = availableSlots.find(slot => {
          // Check if slot name (cleaned) is in the restricted list
          const cleanName = slot.name.split(' (')[0].trim();
          return !unavailableSlotNames.some(un => un.trim() === cleanName);
        });

        if (firstMatchingSlot) {
          return {
            date: dateStr,
            timeSlot: `${firstMatchingSlot.name} (${formatTime(firstMatchingSlot.startTime)} - ${formatTime(firstMatchingSlot.endTime)})`,
            slotId: firstMatchingSlot._id,
            dayOfWeek
          };
        }
      }
      return null;
    } catch (error) {
      console.error('📍 [AppContext] Error finding next slot for product:', error);
      return null;
    }
  };

  const validateAndSetSlot = async (slotOrFn, manualSelection = false) => {
    // Support functional updates like setSelectedSlot(prev => ...)
    const slot = typeof slotOrFn === 'function' ? slotOrFn(selectedSlot) : slotOrFn;

    if (!slot) {
      clearSlot();
      return;
    }

    // Validate cart items against new slot
    const validation = await validateCartForSlot(slot);

    if (!validation.valid && validation.unavailableItems.length > 0) {
      // Just warn, do NOT remove items automatically
      console.log(`${validation.unavailableItems.length} item(s) unavailable for selected slot`);
    }

    setSelectedSlot(slot);

    // Set manual selection flag if this was a user action
    if (manualSelection) {
      setUserManuallySelectedSlot(true);
      localStorage.setItem('userManuallySelectedSlot', 'true');
      console.log('📍 [validateAndSetSlot] User manually selected slot - auto-upgrade disabled');
    }

    // Safeguard: Ensure we don't store "undefined" string
    if (slot) {
      localStorage.setItem('selectedSlot', JSON.stringify(slot));
    } else {
      localStorage.removeItem('selectedSlot');
    }

    // Update day of week
    if (slot.date) {
      const day = getDayOfWeek(slot.date);
      setSelectedDayOfWeek(day);
    }

    // Only toast it if it's a "complete" slot and not a partial update from Cart
    if (slot.date && slot.timeSlot) {
      // toast.success(`Slot selected: ${slot.timeSlot}`); // Removed redundant toast
    }
  };

  // ===== CART MANAGEMENT =====
  const getCartItemsWithDetails = () => {
    return Object.keys(cartItems).map(itemKey => {
      const [productId, weightIndex] = itemKey.split('_');
      const product = getProductById(productId);
      const quantity = cartItems[itemKey];

      return {
        itemKey,
        product,
        weightIndex: parseInt(weightIndex),
        quantity,
        customization: customizationData[itemKey] || { isCustomized: false, instructions: '' }
      };
    }).filter(item => item.product);
  };

  const getCustomizationCharge = (product, weightInGrams) => {
    if (!product || !product.isCustomizable || !product.customizationCharges || product.customizationCharges.length === 0) return 0;

    // Sort charges by weight descending to match largest units first
    const sortedCharges = [...product.customizationCharges].sort((a, b) => b.weight - a.weight);

    let remainingWeight = weightInGrams;
    let totalCharge = 0;

    for (const rule of sortedCharges) {
      if (rule.weight <= 0) continue;
      const count = Math.floor(remainingWeight / rule.weight);
      if (count > 0) {
        totalCharge += count * rule.charge;
        remainingWeight -= count * rule.weight;
      }
    }

    return totalCharge;
  };

  const updateCustomization = (itemKey, data) => {
    setCustomizationData(prev => {
      const newData = {
        ...prev,
        [itemKey]: { ...(prev[itemKey] || { isCustomized: false, instructions: '' }), ...data }
      };
      localStorage.setItem('customizationData', JSON.stringify(newData));
      return newData;
    });
  };

  const triggerLimitPopup = (product, limit, unit) => {
    if (limitTimeout) clearTimeout(limitTimeout);
    setLimitPopup({ productName: product.name, limit, unit });
    const timeout = setTimeout(() => setLimitPopup(null), 5000);
    setLimitTimeout(timeout);
  };

  const addToCart = (itemKey, quantity = 1) => {
    // REQUIRE LOGIN TO ADD TO CART
    if (!requireAuth()) return;

    const [productId] = itemKey.split('_');
    const product = getProductById(productId);

    if (!product) return;

    const currentQty = cartItems[itemKey] || 0;
    const newQty = currentQty + quantity;

    if (product.maxOrderQuantity > 0 && newQty > product.maxOrderQuantity) {
      const weight = product.weights?.[parseInt(itemKey.split('_')[1])];
      triggerLimitPopup(product, product.maxOrderQuantity, weight?.unit || 'pack');
      return;
    }

    setCartItems(prev => {
      const newCart = {
        ...prev,
        [itemKey]: newQty
      };

      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });

    toast.success('Item added to cart');
  };

  const updateCartItem = (itemKey, quantity) => {
    const [productId] = itemKey.split('_');
    const product = getProductById(productId);

    if (quantity <= 0) {
      removeCartItem(itemKey);
    } else {
      if (product && product.maxOrderQuantity > 0 && quantity > product.maxOrderQuantity) {
        const weight = product.weights?.[parseInt(itemKey.split('_')[1])];
        triggerLimitPopup(product, product.maxOrderQuantity, weight?.unit || 'pack');
        return;
      }
      setCartItems(prev => {
        const newCart = {
          ...prev,
          [itemKey]: quantity
        };
        localStorage.setItem('cartItems', JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  const removeCartItem = (itemKey) => {
    setCartItems(prev => {
      const newCart = { ...prev };
      delete newCart[itemKey];
      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });

    setCustomizationData(prev => {
      const newData = { ...prev };
      delete newData[itemKey];
      localStorage.setItem('customizationData', JSON.stringify(newData));
      return newData;
    });

    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCartItems({});
    setCustomizationData({});
    localStorage.removeItem('cartItems');
    localStorage.removeItem('customizationData');
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return getCartItemsWithDetails().reduce((total, item) => {
      const weight = item.product.weights?.[item.weightIndex];
      const price = weight?.price || item.product.price || 0;
      let lineTotal = price * item.quantity;

      if (item.customization?.isCustomized) {
        // Calculate weight in grams
        let totalGrams = 0;
        const weightValue = parseFloat(weight.weight) || 0;
        if (weight.unit === 'kg') {
          totalGrams = weightValue * 1000 * item.quantity;
        } else if (weight.unit === 'g') {
          totalGrams = weightValue * item.quantity;
        }

        const extraCharge = getCustomizationCharge(item.product, totalGrams);
        lineTotal += extraCharge;
      }

      return total + lineTotal;
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  // Compute cartCount reactively
  useEffect(() => {
    const count = getCartItemCount();
    setCartCount(count);
  }, [cartItems]);

  // Context value
  const value = {
    // Auth
    user,
    setUser,
    isLoggedIn,
    showUserLogin,
    setShowUserLogin,
    loginWithGoogle,
    logout,
    updateUserProfile,
    requireAuth,

    // Products
    products,
    loading,
    lastUpdated,
    fetchProducts,
    refreshProducts,
    startProductPolling,
    stopProductPolling,
    getProductById,
    getProductStockStatus,
    checkProductAvailability,
    validateCartForSlot,

    // Cart
    cartItems,
    setCartItems,
    cartCount,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getCartItemsWithDetails,
    getCartTotal,
    getCartItemCount,
    getCartAmount: getCartTotal,
    getCustomizationCharge,
    updateCustomization,
    customizationData,
    recentItems,
    setRecentItems,

    // Search
    searchQuery,
    setSearchQuery,
    searchTriggered,
    setSearchTriggered,

    // Limit Popup
    limitPopup,
    setLimitPopup,

    // Enhanced Slot Management
    selectedSlot,
    setSelectedSlot: validateAndSetSlot, // Enhanced setter
    validateAndSetSlot, // Export directly for manual selection flag
    selectedDayOfWeek,
    clearSlot,
    isSlotSelected,
    getFormattedSlot,
    getDayOfWeek,
    findNextAvailableSlotForProduct,
    userManuallySelectedSlot,

    // Constants
    CURRENCY,
    API_URL,
    POLLING_INTERVAL,

    // Service Areas
    serviceAreas,
    fetchServiceAreas
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
