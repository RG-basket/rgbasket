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

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Slot State
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(null);
  const [slotInitialized, setSlotInitialized] = useState(false);

  // Cache State
  const [categoriesCache, setCategoriesCache] = useState(null);
  const [slotsCache, setSlotsCache] = useState(null);

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
      // Get tomorrow's date in IST for availability check
      const tomorrow = getISTDate();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = getISTDateString(tomorrow);

      // Fetch slot availability for tomorrow
      const response = await axios.get(`${API_URL}/api/slots/availability?date=${tomorrowDate}`);

      if (Array.isArray(response.data)) {
        const availableSlots = response.data.filter(slot => slot.isAvailable);

        if (availableSlots.length > 0) {
          // Return the first available slot (Morning slot)
          const firstSlot = availableSlots[0];
          return {
            date: tomorrowDate,
            timeSlot: `${firstSlot.name} (${firstSlot.startTime} - ${firstSlot.endTime})`,
            slotId: firstSlot._id
          };
        }
      }

      // Fallback: Create default slot if no API slots available
      console.log('No available slots found, creating default slot');
      return {
        date: tomorrowDate,
        timeSlot: 'Morning (07:00 - 10:00)',
        slotId: 'default-morning-slot'
      };

    } catch (error) {
      console.log('Slot API not available, using default slot:', error.message);
      // Fallback: Create default slot using IST
      const tomorrow = getISTDate();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = getISTDateString(tomorrow);

      return {
        date: tomorrowDate,
        timeSlot: 'Morning (07:00 - 10:00)',
        slotId: 'default-morning-slot'
      };
    }
  };

  // Initialize slot on app load
  useEffect(() => {
    const initializeSlot = async () => {
      // Only auto-select if no slot is already saved AND products are empty
      const savedSlot = localStorage.getItem('selectedSlot');

      if (!savedSlot && products.length === 0 && !slotInitialized) {
        console.log('🔄 Initializing slot for first app load...');

        try {
          const nearestSlot = await findNearestAvailableSlot();
          if (nearestSlot) {
            // Directly set the slot without validation (since cart is empty)
            setSelectedSlot(nearestSlot);
            localStorage.setItem('selectedSlot', JSON.stringify(nearestSlot));

            // Update day of week
            if (nearestSlot.date) {
              const day = getDayOfWeek(nearestSlot.date);
              setSelectedDayOfWeek(day);
            }

            console.log('✅ Auto-selected slot:', nearestSlot.timeSlot);

            // Immediately fetch products for this slot
            await fetchProductsForSlot(nearestSlot);
          }
        } catch (error) {
          console.error('Slot initialization failed:', error);
        } finally {
          setSlotInitialized(true);
        }
      } else if (savedSlot && !slotInitialized) {
        // Slot already exists, just mark as initialized
        setSlotInitialized(true);
      }
    };

    initializeSlot();
  }, [products.length, slotInitialized]);

  // Helper function to fetch products for a specific slot
  const fetchProductsForSlot = async (slot) => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/products`;

      if (slot && slot.timeSlot) {
        const slotName = slot.timeSlot.split(' (')[0];
        url += `?slot=${slotName}`;

        if (slot.date) {
          const day = getDayOfWeek(slot.date);
          url += `&dayOfWeek=${day}`;
        }
      }

      const response = await axios.get(url);

      if (response.data && (response.data.products || Array.isArray(response.data))) {
        const productsData = response.data.products || response.data;
        setProducts(productsData);
        setLastUpdated(new Date());
        console.log('✅ Products loaded for auto-selected slot:', productsData.length, 'products');
      }
    } catch (error) {
      console.error('Error fetching products for slot:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== AUTHENTICATION =====
  useEffect(() => {
    loadAuthState();
    loadCartState();
    // loadSlotState is now async, so we need to call it properly
    loadSlotState().catch(err => {
      console.error('Error loading slot state on mount:', err);
    });
  }, []);

  const loadAuthState = () => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedAuth = localStorage.getItem('isLoggedIn');

      if (savedUser && savedAuth === 'true') {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
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
    } catch (error) {
      console.error('Error loading cart state:', error);
      localStorage.removeItem('cartItems');
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
      const savedSlot = localStorage.getItem('selectedSlot');
      if (savedSlot) {
        const slot = JSON.parse(savedSlot);

        // Validate the saved slot
        const validation = await validateSavedSlot(slot);

        if (validation.valid) {
          // Slot is still valid, use it
          setSelectedSlot(slot);

          // Calculate day of week for saved slot
          if (slot?.date) {
            const dayOfWeek = getDayOfWeek(slot.date);
            setSelectedDayOfWeek(dayOfWeek);
          }
        } else {
          // Slot has expired, clear it and auto-select nearest available
          console.log(`🔄 Saved slot expired: ${validation.reason}`);
          localStorage.removeItem('selectedSlot');

          // Auto-select nearest available slot
          const nearestSlot = await findNearestAvailableSlot();
          if (nearestSlot) {
            setSelectedSlot(nearestSlot);
            localStorage.setItem('selectedSlot', JSON.stringify(nearestSlot));

            if (nearestSlot.date) {
              const dayOfWeek = getDayOfWeek(nearestSlot.date);
              setSelectedDayOfWeek(dayOfWeek);
            }

            // Notify user about the slot change
            toast.info(`Your previous slot expired. Auto-selected: ${nearestSlot.timeSlot}`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading slot state:', error);
      localStorage.removeItem('selectedSlot');
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

      await axios.post(`${API_URL}/api/auth/google`, userData);

      const userProfile = {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        id: user.uid,
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

  const validateAndSetSlot = async (slot) => {
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
    localStorage.setItem('selectedSlot', JSON.stringify(slot));

    // Update day of week
    if (slot.date) {
      const day = getDayOfWeek(slot.date);
      setSelectedDayOfWeek(day);
    }

    toast.success(`Slot selected: ${slot.timeSlot}`);
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
        quantity
      };
    }).filter(item => item.product);
  };

  const addToCart = (itemKey, quantity = 1) => {
    setCartItems(prev => {
      const newCart = {
        ...prev,
        [itemKey]: (prev[itemKey] || 0) + quantity
      };
      // Save to localStorage
      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });

    toast.success('Item added to cart');
  };

  const updateCartItem = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeCartItem(itemKey);
    } else {
      setCartItems(prev => {
        const newCart = {
          ...prev,
          [itemKey]: quantity
        };
        // Save to localStorage
        localStorage.setItem('cartItems', JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  const removeCartItem = (itemKey) => {
    setCartItems(prev => {
      const newCart = { ...prev };
      delete newCart[itemKey];
      // Save to localStorage
      localStorage.setItem('cartItems', JSON.stringify(newCart));
      return newCart;
    });

    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCartItems({});
    localStorage.removeItem('cartItems');
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return getCartItemsWithDetails().reduce((total, item) => {
      const weight = item.product.weights?.[item.weightIndex];
      const price = weight?.price || item.product.price || 0;
      return total + (price * item.quantity);
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
    recentItems,
    setRecentItems,

    // Search
    searchQuery,
    setSearchQuery,
    searchTriggered,
    setSearchTriggered,

    // Enhanced Slot Management
    selectedSlot,
    setSelectedSlot: validateAndSetSlot, // Enhanced setter
    selectedDayOfWeek,
    clearSlot,
    isSlotSelected,
    getFormattedSlot,
    getDayOfWeek,

    // Constants
    CURRENCY,
    API_URL,
    POLLING_INTERVAL
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
