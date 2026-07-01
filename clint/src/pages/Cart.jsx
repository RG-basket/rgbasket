import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import AddressForm from "../components/Address/AddressForm";
import useCartStore from "../store/useCartStore";
import toast from "react-hot-toast";
import {
  OutOfStockBanner,
  EmptyCart,
  CartItemsList,
  OrderSummary,
  UnavailableItemsModal,
  ExclusivityModal,
  StaleCartModal

} from "../components/Cart";
import OfferSelectionModal from "../components/Cart/OfferSelectionModal";
import OfferFloatingBubble from "../components/Cart/OfferFloatingBubble";
import LocationPrompt from "../components/Cart/LocationPrompt";



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


const Cart = () => {
  const {
    products,
    CURRENCY,
    cartItems,
    removeCartItem,
    updateCartItem,
    getCartTotal,
    getCartAmount,
    user,
    setCartItems,
    selectedSlot,
    setSelectedSlot,
    validateCartForSlot,
    customizationData,
    getCustomizationCharge,
    serviceAreas,
    rewardSettings,
    refreshUserCoins,
    activeSurges
  } = useAppContext();
  const navigate = useNavigate();
  const summaryRef = useRef(null);

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentOption, setPaymentOption] = useState("COD");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [unavailableItems, setUnavailableItems] = useState({});
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [instruction, setInstruction] = useState(() => {
    return localStorage.getItem('cartInstruction') || "";
  });
  // Persist location across Cart remounts (e.g. user browses then comes back)
  // sessionStorage survives navigation within the same app session but clears on close
  const [orderLocation, setOrderLocation] = useState(() => {
    try {
      const cached = sessionStorage.getItem('orderLocationCache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);

  // Helper: set location and persist it to sessionStorage
  const persistLocation = (loc) => {
    setOrderLocation(loc);
    if (loc) {
      try { sessionStorage.setItem('orderLocationCache', JSON.stringify(loc)); } catch {}
    }
  };

  // Stale Cart Detection State
  const [staleCartItems, setStaleCartItems] = useState([]);
  const [showStaleCartModal, setShowStaleCartModal] = useState(false);


  // Promo Code State
  const [promoCode, setPromoCode] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // RG Coin State
  const [useCoins, setUseCoins] = useState(false);
  const [coinsUsed, setCoinsUsed] = useState(0);
  const [coinDiscount, setCoinDiscount] = useState(0);
  const [pendingCoinsAmount, setPendingCoinsAmount] = useState(null);

  // Sync latest coins on entry to cart
  useEffect(() => {
    refreshUserCoins();
  }, []);

  // Define totalBeforeCoins early for use in toggleCoins
  // These will be recalculated properly in the render cycle
  const [currentTotalBeforeCoins, setCurrentTotalBeforeCoins] = useState(0);

  const toggleCoins = (amount = null) => {
    const { conversionRate = 10, maxRedemptionRupees = 30, minOrderForRedemption = 0 } = rewardSettings;

    // Check for minimum coin balance (must be at least 10 coins to get ₹1 discount)
    if (amount !== 0 && (user?.rgCoins || 0) < conversionRate) {
      toast.error(`You need at least ${conversionRate} coins to start redeeming`);
      return;
    }

    // Exclusivity Check: If promo or gift is applied, ask to switch
    if (amount !== 0 && (promoApplied || selectedGift)) {
        setPendingCoinsAmount(amount);
        setExclusivityType('coins');
        setShowExclusivityModal(true);
        return;
    }

    // Check for minimum order threshold
    if (amount !== 0 && currentTotalBeforeCoins < minOrderForRedemption) {
      toast.error(`Minimum order of ${currencySymbol}${minOrderForRedemption} required to use RG Coins`);
      return;
    }

    // Cap by both Admin limit AND current cart total
    const maxCoinsByAdmin = maxRedemptionRupees * conversionRate;
    const maxCoinsByCartTotal = Math.floor(Math.max(0, currentTotalBeforeCoins) * conversionRate);
    const absoluteMaxCoins = Math.min(user?.rgCoins || 0, maxCoinsByAdmin, maxCoinsByCartTotal);

    if (amount === 0 || (amount === null && useCoins)) {
      setUseCoins(false);
      setCoinsUsed(0);
      setCoinDiscount(0);
      if (amount === 0) toast.success("RG Coins removed");
      return;
    }

    // Apply the absoluteMaxCoins limit
    const coinsToUse = amount !== null ? Math.min(amount, absoluteMaxCoins) : absoluteMaxCoins;

    if (coinsToUse <= 0) {
      toast.error("Please select an amount of coins to use");
      return;
    }

    setCoinsUsed(coinsToUse);
    setCoinDiscount(coinsToUse / conversionRate);
    setUseCoins(true);
    toast.success(`Applied ${coinsToUse} RG Coins! Saved ₹${(coinsToUse / conversionRate).toFixed(2)}`);
  };
  const [selectedGift, setSelectedGift] = useState(() => {
    return localStorage.getItem('cartSelectedGift') || null;
  });
  const [appliedOfferThreshold, setAppliedOfferThreshold] = useState(() => {
    return parseInt(localStorage.getItem('cartAppliedOfferThreshold') || '0');
  });




  // Gift Offers State
  const [activeOffers, setActiveOffers] = useState([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isOfferMinimized, setIsOfferMinimized] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const [showExclusivityModal, setShowExclusivityModal] = useState(false);
  const [exclusivityType, setExclusivityType] = useState(null); // 'promo' or 'gift'
  const [pendingPromo, setPendingPromo] = useState(null);
  const [pendingGift, setPendingGift] = useState(null);
  const [shownThresholds, setShownThresholds] = useState(() => {

    try {
      return JSON.parse(sessionStorage.getItem('shownOfferThresholds') || '[]');
    } catch {
      return [];
    }
  });


  // Persist instruction and gifts
  useEffect(() => {
    localStorage.setItem('cartInstruction', instruction);
  }, [instruction]);

  useEffect(() => {
    if (selectedGift) {
      localStorage.setItem('cartSelectedGift', selectedGift);
      localStorage.setItem('cartAppliedOfferThreshold', appliedOfferThreshold.toString());
    } else {
      localStorage.removeItem('cartSelectedGift');
      localStorage.removeItem('cartAppliedOfferThreshold');
    }
  }, [selectedGift, appliedOfferThreshold]);


  // Safe currency symbol
  const currencySymbol = CURRENCY || '₹';


  const captureLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('📍 Geolocation is not supported by this browser');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 GPS position acquired successfully');
          resolve({
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('📍 Geolocation capture failed:', error.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 } // 10-min cache avoids redundant GPS locks
      );
    });
  };



  // Tip state
  const [tipAmount, setTipAmount] = useState(0);

  // --- CALCULATE TOTALS EARLY TO AVOID REFERENCE ERRORS ---
  const rawSubtotal = cartArray.reduce((acc, item) => acc + (item.offerPrice ?? item.price) * item.quantity + (item.customizationCharge || 0), 0);
  const subtotal = Math.round(rawSubtotal * 100) / 100;
  const totalMRP = Math.round(cartArray.reduce((acc, item) => acc + (item.price || 0) * item.quantity + (item.customizationCharge || 0), 0) * 100) / 100;
  const totalSavings = Math.round((totalMRP - subtotal) * 100) / 100;

  // Round discount to match backend before comparison
  const roundedDiscountForShipping = Math.round(discountAmount * 100) / 100;
  const roundedCoinDiscountForShipping = Math.round(coinDiscount * 100) / 100;
  
  // Logic: Shipping is free if (Subtotal - Promo - Coins) >= Threshold. 
  // Tip is NOT included in this threshold check.
  const netValueForShipping = subtotal - roundedDiscountForShipping - roundedCoinDiscountForShipping;

  // Dynamic Shipping Fee based on Pincode
  const selectedArea = serviceAreas?.find(area => area.pincode === selectedAddress?.pincode && area.isActive);
  const baseShippingFee = selectedArea ? (selectedArea.deliveryCharge ?? 0) : 29;
  const freeDeliveryThreshold = selectedArea ? (selectedArea.minOrderForFreeDelivery ?? 299) : 299;

  const shippingFee = (cartArray.length > 0 && netValueForShipping < freeDeliveryThreshold) ? baseShippingFee : 0;

  // Split shipping fee into emotional components
  const standardFee = shippingFee > 0 ? Math.min(shippingFee, 29) : 0;
  const distanceSurcharge = shippingFee > 29 ? (shippingFee - 29) : 0;

  const tax = 0;

  // Final Total Amount with exact rounding to match backend
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedShipping = Math.round(shippingFee * 100) / 100;
  const roundedTax = Math.round(tax * 100) / 100;
  const roundedTip = Math.round(tipAmount * 100) / 100;
  const roundedDiscount = Math.round(discountAmount * 100) / 100;
  const roundedCoinDiscount = Math.round(coinDiscount * 100) / 100;

  // Wallet Adjustment Logic (Auto-Recovery)
  // Soft logic: Only show surcharge if the debt is at least 1 Rupee (10 coins)
  const conversionRate = rewardSettings?.conversionRate || 10;
  const coinDebtRecovery = (user && user.rgCoins < 0 && Math.abs(user.rgCoins) >= conversionRate) 
    ? Math.abs(user.rgCoins) / conversionRate 
    : 0;
  const roundedCoinDebtRecovery = Math.round(coinDebtRecovery * 100) / 100;

  // IMPORTANT: Thresholds for Redemption (RG Coins) and Shipping must IGNORE tips.
  // totalForThresholds check if we reach min order values (₹150 for coins, ₹299 for shipping)
  const totalForThresholds = Math.round((roundedSubtotal - roundedDiscount) * 100) / 100;

  // Calculate total before coins to cap redemption. This INCLUDES shipping/tax/tip.
  const totalBeforeCoins = Math.round((roundedSubtotal + roundedShipping + roundedTax + roundedTip - roundedDiscount) * 100) / 100;

  // Keep track of totals for toggleCoins use
  useEffect(() => {
    // Pass both values so toggleCoins can differentiate between "amount I can pay" and "amount for threshold"
    setCurrentTotalBeforeCoins(totalBeforeCoins);
    // We'll use totalForThresholds inside the component or pass it down
  }, [totalBeforeCoins]);

  const surgeChargeAmount = Array.isArray(activeSurges)
    ? activeSurges.reduce((sum, s) => sum + Number(s.amount || 0), 0)
    : 0;
  let totalAmount = totalBeforeCoins - roundedCoinDiscount + roundedCoinDebtRecovery + surgeChargeAmount;
  if (totalAmount < 0) totalAmount = 0;
  totalAmount = Math.round(totalAmount * 100) / 100;


  // Sync Global -> Local

  // Sync Local -> Global logic removed. Using selectedSlot directly.

  // Automatically request location when entering cart
  useEffect(() => {
    const initLocation = async () => {
      // Already have a location cached from this session — skip everything
      // This prevents the popup showing again when the user navigates back to Cart
      if (orderLocation) {
        console.log('📍 Using cached session location, skipping prompt.');
        return;
      }

      if (!navigator.permissions) {
        // Fallback for browsers without permissions API (some Capacitor webviews)
        const loc = await captureLocation();
        if (loc) persistLocation(loc);
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });

        if (result.state === 'granted') {
          const loc = await captureLocation();
          if (loc) persistLocation(loc);
        } else if (result.state === 'prompt') {
          // Show our beautiful popup before browser prompt
          setShowLocationPrompt(true);
        } else if (result.state === 'denied') {
          setIsGeoBlocked(true);
          setShowLocationPrompt(true);
        }

        result.onchange = () => {
          if (result.state === 'granted') {
            setIsGeoBlocked(false);
            captureLocation().then(persistLocation);
          }
        };
      } catch (err) {
        console.warn("Permissions API error:", err);
      }
    };
    initLocation();
  }, []); // intentionally empty — runs once per mount, but exits early if location is cached

  const handleAcceptLocation = async () => {
    setShowLocationPrompt(false);
    const loc = await captureLocation();
    if (loc) {
      persistLocation(loc); // cache so future Cart visits don't prompt again
      toast.success("Location locked for delivery!");
    } else {
      toast.error("Could not get location. Please type address manually.");
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    const userId = user?.id || user?._id;

    if (!userId) {
      setAddresses([]);
      setSelectedAddress(null);
      return;
    }

    try {
      setLoadingAddresses(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/user/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.addresses && data.addresses.length > 0) {
        setAddresses(data.addresses);

        const defaultAddress = data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);

      // Fallback to localStorage
      try {
        const localAddresses = JSON.parse(localStorage.getItem('userAddresses') || '[]');
        const userAddresses = localAddresses.filter(addr => addr.user === userId);

        if (userAddresses.length > 0) {
          setAddresses(userAddresses);
          const defaultAddress = userAddresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
          } else {
            setSelectedAddress(userAddresses[0]);
          }
        } else {
          setAddresses([]);
          setSelectedAddress(null);
        }
      } catch (localError) {
        console.error('Local storage error:', localError);
        setAddresses([]);
        setSelectedAddress(null);
      }
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Check stock status for all cart items
  const checkStockStatus = () => {
    const outOfStock = cartArray.filter(item => !item.inStock);
    setOutOfStockItems(outOfStock);
    return outOfStock.length === 0;
  };

  // Comprehensive Stale Cart Validation
  const validateStaleCart = async () => {
    if (cartArray.length === 0) return { isValid: true, staleItems: [] };

    const staleItems = [];
    let cartWasModified = false;

    for (const cartItem of cartArray) {
      // Fetch fresh product data from backend
      const freshProduct = products.find(p => p._id === cartItem._id);

      if (!freshProduct) {
        // Product no longer exists
        staleItems.push({
          ...cartItem,
          reason: 'inactive',
          message: 'Product no longer available'
        });
        continue;
      }

      // Check if product is inactive
      if (freshProduct.active === false) {
        staleItems.push({
          ...cartItem,
          reason: 'inactive',
          message: 'Product has been removed from our catalog'
        });
        continue;
      }

      // Find the specific weight variant
      const variantIndex = freshProduct.weights?.findIndex(
        w => w.weight === cartItem.weight && w.unit === cartItem.unit
      );

      if (variantIndex === -1) {
        // Variant no longer exists
        staleItems.push({
          ...cartItem,
          reason: 'inactive',
          message: 'This variant is no longer available'
        });
        continue;
      }

      const freshVariant = freshProduct.weights[variantIndex];

    // Check stock availability
      if (!freshProduct.inStock || freshProduct.stock <= 0) {
        staleItems.push({
          ...cartItem,
          reason: 'out_of_stock',
          message: 'Currently out of stock'
        });
        continue;
      }

      // Check if cart quantity exceeds available stock
      if (cartItem.quantity > freshProduct.stock) {
        // Auto-adjust quantity to available stock
        const cartKey = cartItem.cartKey;
        const newQuantity = freshProduct.stock;

        // Update cart silently
        updateCartItem(cartKey, newQuantity);
        cartWasModified = true;

        staleItems.push({
          ...cartItem,
          reason: 'quantity_adjusted',
          requestedQuantity: cartItem.quantity,
          availableQuantity: newQuantity,
          message: `Only ${newQuantity} available (you had ${cartItem.quantity})`
        });
      }

      // Check maxOrderQuantity if set
      if (freshProduct.maxOrderQuantity > 0 && cartItem.quantity > freshProduct.maxOrderQuantity) {
        const cartKey = cartItem.cartKey;
        updateCartItem(cartKey, freshProduct.maxOrderQuantity);
        cartWasModified = true;

        staleItems.push({
          ...cartItem,
          reason: 'quantity_adjusted',
          requestedQuantity: cartItem.quantity,
          availableQuantity: freshProduct.maxOrderQuantity,
          message: `Maximum ${freshProduct.maxOrderQuantity} per order`
        });
      }
    }

    return {
      isValid: staleItems.length === 0,
      staleItems,
      cartWasModified
    };
  };


  // Validate cart against selected slot
  const validateCart = async () => {
    if (!selectedSlot || !selectedSlot.date || !selectedSlot.timeSlot) {
      setUnavailableItems({});
      return;
    }

    const newUnavailableItems = {};

    if (validateCartForSlot) {
      const result = await validateCartForSlot(selectedSlot);
      if (!result.valid) {
        result.unavailableItems.forEach(item => {
          newUnavailableItems[item.itemKey] = item.unavailabilityReason;
        });
      }
    }

    setUnavailableItems(newUnavailableItems);

    // Show modal if there are unavailable items
    if (Object.keys(newUnavailableItems).length > 0) {
      setShowUnavailableModal(true);
    }
  };

  // Remove all unavailable items (both out of stock and slot-unavailable)
  const removeAllUnavailableItems = () => {
    let removedCount = 0;

    // Remove out of stock items
    outOfStockItems.forEach((item) => {
      removeCartItem(item.cartKey);
      removedCount++;
    });

    // Remove slot-unavailable items
    Object.keys(unavailableItems).forEach((cartKey) => {
      removeCartItem(cartKey);
      removedCount++;
    });

    if (removedCount > 0) {
      toast.success(`${removedCount} unavailable item(s) removed from cart.`);
      setOutOfStockItems([]);
      setUnavailableItems({});
      setShowUnavailableModal(false);
    } else {
      toast.error("No unavailable items to remove.");
    }
  };

  // Re-validate when slot or cart changes
  useEffect(() => {
    if (cartArray.length > 0 && selectedSlot) {
      validateCart();
    } else {
      setUnavailableItems({});
    }
  }, [selectedSlot, cartArray.length]);

  const getCart = () => {
    let tempArray = [];

    for (const key in cartItems) {
      const [productId, weightIndexStr] = key.split("_");
      const weightIndex = parseInt(weightIndexStr);
      const product = products.find((item) => item._id === productId);

      // Handle both old format (weight string) and new format (index) for backward compatibility
      let variant;
      if (!isNaN(weightIndex) && product?.weights?.[weightIndex]) {
        variant = product.weights[weightIndex];
      } else {
        // Fallback for old keys or if index is invalid
        variant = product?.weights?.find((w) => w.weight === weightIndexStr);
      }

      if (product && variant) {
        const quantity = cartItems[key];
        const customization = customizationData[key] || { isCustomized: false, instructions: '' };

        let customizationCharge = 0;
        let totalGrams = 0;
        if (customization.isCustomized && product.isCustomizable) {
          const weightValue = parseFloat(variant.weight) || 0;
          if (variant.unit === 'kg') {
            totalGrams = weightValue * 1000 * quantity;
          } else if (variant.unit === 'g') {
            totalGrams = weightValue * quantity;
          }
          customizationCharge = getCustomizationCharge(product, totalGrams);
        }

        tempArray.push({
          ...product,
          weight: variant.weight,
          unit: variant.unit,
          offerPrice: variant.offerPrice,
          price: variant.price,
          quantity: quantity,
          cartKey: key,
          inStock: variant.inStock !== false,
          customization,
          customizationCharge,
          totalGrams
        });
      }
    }

    setCartArray(tempArray);
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please add a delivery address first!");
      setShowAddressForm(true);
      return;
    }

    if (cartArray.length === 0) {
      toast.error("Your cart is empty. Add items before placing an order.");
      return;
    }

    if (!selectedSlot?.date || !selectedSlot?.timeSlot) {
      toast.error("Please select a delivery date and time slot.");
      return;
    }

    // Validate stale cart before placing order
    const staleValidation = await validateStaleCart();
    if (!staleValidation.isValid) {
      const criticalIssues = staleValidation.staleItems.filter(
        item => item.reason === 'out_of_stock' || item.reason === 'inactive'
      );

      if (criticalIssues.length > 0) {
        setStaleCartItems(staleValidation.staleItems);
        setShowStaleCartModal(true);
        toast.error("Some items in your cart need attention before checkout.");
        return;
      }

      // If only quantity adjustments, show modal but allow to continue after acknowledgment
      if (staleValidation.staleItems.length > 0) {
        setStaleCartItems(staleValidation.staleItems);
        setShowStaleCartModal(true);
        return;
      }
    }

    if (!checkStockStatus()) {
      toast.error("Some items in your cart are out of stock. Please remove them to continue.");
      return;
    }

    if (Object.keys(unavailableItems).length > 0) {
      toast.error("Some items are unavailable for the selected slot. Please remove them to continue.");
      return;
    }


    // Optional nudge for location if missing - but NEVER block the order
    if (!orderLocation && !isGeoBlocked) {
      // We'll proceed with the order, but we can attempt a silent capture in the background
      console.log("No location captured, attempting silent fallback during placement.");
    }

    setIsPlacingOrder(true);

    try {
      // Use existing captured location or attempt a very fast final capture
      console.log('📍 Getting location data for order...');
      let locationData = orderLocation;

      if (!locationData) {
        // Try a fast 3-second capture if we don't have it yet
        locationData = await Promise.race([
          captureLocation(),
          new Promise(resolve => setTimeout(() => resolve(null), 3000))
        ]);
      }
      console.log('📍 Location data resolved (or timed out):', locationData);

      const orderItems = cartArray.map(item => ({
        productId: item._id,
        name: item.name,
        description: Array.isArray(item.description)
          ? item.description.join(', ')
          : (item.description || `${item.name} - ${item.weight}`),
        weight: item.weight,
        unit: item.unit,
        quantity: item.quantity,
        price: item.offerPrice || item.price,
        isCustomized: item.customization?.isCustomized || false,
        customizationInstructions: item.customization?.instructions || '',
        customizationCharge: item.customizationCharge || 0,
        image: item.images?.[0] || item.image?.[0] || '',
        userName: user?.name || 'Guest',
        userImage: user?.photo || ''
      }));

      const orderData = {
        items: orderItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phoneNumber: selectedAddress.phoneNumber,
          alternatePhone: selectedAddress.alternatePhone || '',
          street: selectedAddress.street,
          locality: selectedAddress.locality,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          landmark: selectedAddress.landmark || ''
        },
        paymentMethod: paymentOption === "COD" ? "cash_on_delivery" : "online",
        deliveryDate: selectedSlot.date,
        timeSlot: selectedSlot.timeSlot, // Save full string like "Morning (7:00 AM - 10:00 AM)"
        userId: user?.id || user?._id,
        userInfo: {
          name: user?.name || 'Guest',
          email: user?.email || '',
          photo: user?.photo || '',
          phone: selectedAddress.phoneNumber
        },
        instruction: instruction || "",
        promoCode: promoCode || null,
        useCoins: useCoins,
        selectedGift: selectedGift || null,
        tipAmount: tipAmount || 0,
        location: locationData,
        coinsUsed: coinsUsed // Add explicitly to ensure selected amount is used
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order placed successfully!');

        // SECURITY FIX: Instantly refresh the user's coin balance from the backend
        // This prevents the "Double Spend" UI glitch where coins still appear after an order
        refreshUserCoins();

        // Bridge to Instamart Experience - Set active order for real-time tracking bar
        useCartStore.setState({ 
          activeOrder: {
            id: data.order._id || data.order.id,
            status: (data.order.status || 'Confirmed').toLowerCase(),
            displayStatus: data.order.status || 'Confirmed',
            items: data.order.items || [],
            total: data.order.totalAmount || data.order.total || 0,
            timestamp: data.order.createdAt || new Date().toISOString(),
            deliveryDate: data.order.deliveryDate,
            timeSlot: data.order.timeSlot,
            eta: 18 // Default ETA
          }
        });

        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartInstruction');
        localStorage.removeItem('cartSelectedGift');
        localStorage.removeItem('cartAppliedOfferThreshold');
        setCartItems({});

        setInstruction("");

        setTimeout(() => {
          navigate('/order-success', { state: { order: data.order } });
        }, 1000);

      } else {
        toast.error(data.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getProductImage = (product) => {
    if (product.images?.[0]) {
      return product.images[0];
    }
    if (product.image?.[0]) {
      return product.image[0];
    }
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
  };

  // Load addresses when user changes
  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAddresses();
    } else {
      setAddresses([]);
      setSelectedAddress(null);
    }
  }, [user]);

  useEffect(() => {
    if (products && cartItems) {
      getCart();
    }
  }, [products, cartItems, customizationData]);

  // Removed redundant deliveryDate initialization. Global state handles this now.

  useEffect(() => {
    if (cartArray.length > 0) {
      checkStockStatus();
    }
  }, [cartArray]);

  // Validate stale cart on page load and when products update
  useEffect(() => {
    const performStaleCartCheck = async () => {
      if (cartArray.length > 0 && products.length > 0) {
        const validation = await validateStaleCart();

        if (!validation.isValid && validation.staleItems.length > 0) {
          setStaleCartItems(validation.staleItems);
          setShowStaleCartModal(true);
        }
      }
    };

    // Run check after a short delay to ensure products are loaded
    const timer = setTimeout(performStaleCartCheck, 500);
    return () => clearTimeout(timer);
  }, [cartArray.length, products.length]);


  // Sync Cart Intent to Backend (Behavioral Tracking)
  useEffect(() => {
    const syncCartIntent = async () => {
      if (!user) return;

      try {
        const userId = user.id || user._id;
        // If cart is empty, send empty items to clear the snapshot
        const cartSnapshot = cartArray.map(item => ({
          productId: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.offerPrice || item.price,
          weight: item.weight
        }));

        await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/intent`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems: cartSnapshot })
        });
      } catch (err) {
        // Silent error to avoid bothering user
        console.debug('Intent sync skipped');
      }
    };

    const timer = setTimeout(syncCartIntent, 2000); // 2 second debounce
    return () => clearTimeout(timer);
  }, [cartArray, user]);


  // Fetch gift offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/offers/active`);
        const data = await res.json();
        if (data.success) {
          setActiveOffers(data.offers);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      }
    };
    fetchOffers();
  }, []);

  // Monitor subtotal for offer thresholds
  useEffect(() => {
    if (activeOffers.length === 0 || cartArray.length === 0) return;

    // Only check if user hasn't already selected a gift (optional check, better safe)
    // The requirement says "Only highest eligible offer shows"
    // and "show only once per threshold per session"

    // Base eligibility on Net Amount (Subtotal - Promo Discount)
    const netOrderValue = subtotal - discountAmount;

    const eligibleOffers = activeOffers
      .filter(off => netOrderValue >= off.minOrderValue)
      .sort((a, b) => b.minOrderValue - a.minOrderValue); // Highest first

    if (eligibleOffers.length > 0) {
      const highestOffer = eligibleOffers[0];

      // REACTIVE GIFT SYSTEM: 
      // If they have a gift selected, but their level (tier) has changed in either direction.
      // We reset and ask them to pick according to their CURRENT eligibility.
      if (selectedGift && appliedOfferThreshold !== highestOffer.minOrderValue) {
        setSelectedGift(null);
        setAppliedOfferThreshold(0);

        if (highestOffer.minOrderValue > appliedOfferThreshold) {
          toast.success("You've unlocked a better gift! 🎁");
          // Reset shown status to ensure the higher-tier modal pops up
          const updatedShown = shownThresholds.filter(t => t !== highestOffer.minOrderValue);
          setShownThresholds(updatedShown);
          setIsOfferMinimized(false);
        } else {
          toast.error("Order value changed. Gift offer updated.");
          setIsOfferMinimized(true); // Don't pop up again, just show bubble
        }
        return;
      }

      // Update current offer state if it changed
      if (!currentOffer || currentOffer.minOrderValue !== highestOffer.minOrderValue) {
        setCurrentOffer(highestOffer);
      }

      // Modal/Bubble Management
      if (!selectedGift) {
        // NEW: Don't pop up the offer modal if a promo code is already applied
        if (!shownThresholds.includes(highestOffer.minOrderValue) && !promoApplied) {
          setShowOfferModal(true);
          setIsOfferMinimized(false);
        } else if (!showOfferModal) {
          setIsOfferMinimized(true);
        }
      } else {
        setShowOfferModal(false);
        setIsOfferMinimized(false);
      }

    } else {
      // Below all thresholds
      if (currentOffer) setCurrentOffer(null);
      if (showOfferModal) setShowOfferModal(false);
      if (isOfferMinimized) setIsOfferMinimized(false);

      if (selectedGift) {
        setSelectedGift(null);
        setAppliedOfferThreshold(0);
        toast.error("Order value below threshold. Gift offer removed.");
      }
    }
  }, [subtotal, discountAmount, activeOffers.length, shownThresholds.length, instruction, showOfferModal, selectedGift, appliedOfferThreshold]);




  const handleApplyGift = (giftText) => {
    // Exclusivity Check: If promo or coins are applied, ask to switch
    if (promoApplied || useCoins) {
      setPendingGift(giftText);
      setExclusivityType('gift');
      setShowExclusivityModal(true);
      return;
    }

    setSelectedGift(giftText);
    setAppliedOfferThreshold(currentOffer.minOrderValue);
    setShowOfferModal(false);
    setIsOfferMinimized(false);

    // Mark as shown for this session
    const newShown = [...shownThresholds, currentOffer.minOrderValue];
    setShownThresholds(newShown);
    sessionStorage.setItem('shownOfferThresholds', JSON.stringify(newShown));
    toast.success("Free gift selected!");
  };


  const confirmExclusivitySwitch = () => {
    if (exclusivityType === 'promo') {
      // Switch from Gift/Coins to Promo
      setSelectedGift(null);
      setAppliedOfferThreshold(0);
      setUseCoins(false);
      setCoinsUsed(0);
      setCoinDiscount(0);
      applyPromoCode(pendingPromo, false, true); 
    } else if (exclusivityType === 'gift') {
      // Switch from Promo/Coins to Gift
      removePromoCode();
      setUseCoins(false);
      setCoinsUsed(0);
      setCoinDiscount(0);
      setSelectedGift(pendingGift);
      setAppliedOfferThreshold(currentOffer.minOrderValue);
      setShowOfferModal(false);
      setIsOfferMinimized(false);

      const newShown = [...shownThresholds, currentOffer.minOrderValue];
      setShownThresholds(newShown);
      sessionStorage.setItem('shownOfferThresholds', JSON.stringify(newShown));
      toast.success("Free gift selected!");
    } else if (exclusivityType === 'coins') {
        // Switch from Promo/Gift to Coins
        removePromoCode();
        setSelectedGift(null);
        setAppliedOfferThreshold(0);
        // Now actually toggle the coins since benefit is cleared
        setUseCoins(true);
        const { conversionRate = 10 } = rewardSettings;
        // Calculate max selectable coins to prevent cheating via manual switch
        const maxCoinsByAdmin = (rewardSettings.maxRedemptionRupees || 30) * conversionRate;
        const maxCoinsByCartTotal = Math.floor(Math.max(0, currentTotalBeforeCoins) * conversionRate);
        const absoluteMaxCoins = Math.min(user?.rgCoins || 0, maxCoinsByAdmin, maxCoinsByCartTotal);
        
        const finalAmount = Math.min(pendingCoinsAmount, absoluteMaxCoins);
        setCoinsUsed(finalAmount);
        setCoinDiscount(finalAmount / conversionRate);
        toast.success(`Applied ${finalAmount} RG Coins!`);
    }

    setShowExclusivityModal(false);
    setPendingPromo(null);
    setPendingGift(null);
    setPendingCoinsAmount(null);
  };

  const removeGift = () => {
    setSelectedGift(null);
    setAppliedOfferThreshold(0);
    toast.success("Free gift removed");
  };


  const handleCloseOffer = () => {
    setShowOfferModal(false);
    setIsOfferMinimized(true);
    // Mark as shown so modal doesn't auto-pop again, but logic above will show bubble
    const newShown = [...shownThresholds, currentOffer.minOrderValue];
    setShownThresholds(newShown);
    sessionStorage.setItem('shownOfferThresholds', JSON.stringify(newShown));
  };



  // Re-apply promo if subtotal changes
  useEffect(() => {
    if (promoApplied && promoCode) {
      // Debounce or just call
      const timer = setTimeout(() => {
        applyPromoCode(promoCode, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [subtotal]);


  const applyPromoCode = async (code, silent = false, bypassExclusivity = false) => {
    try {
      // Exclusivity Check: If gift or coins are selected, ask to switch
      if ((selectedGift || useCoins) && !silent && !bypassExclusivity) {
        setPendingPromo(code);
        setExclusivityType('promo');
        setShowExclusivityModal(true);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/promo/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          totalAmount: subtotal,
          userId: user?.id || user?._id // Pass user ID for validation
        })
      });
      const data = await response.json();

      if (data.success) {
        setDiscountAmount(data.data.discountAmount);
        setPromoCode(data.data.code);
        setPromoApplied(true);
        if (!silent) toast.success(`Promo code applied! Saved ₹${data.data.discountAmount}`);
      } else {
        if (!silent) toast.error(data.message || 'Invalid promo code');
        // If validation fails on re-check, remove it
        if (silent) removePromoCode();
      }
    } catch (error) {
      console.error(error);
      if (!silent) toast.error('Error applying promo code');
    }
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setDiscountAmount(0);
    setPromoApplied(false);
    if (!promoApplied) return; // Prevent toast loop if called from silent fail
    // toast.success('Promo code removed'); // Optional
  };

  // Stale Cart Modal Handlers
  const handleRemoveStaleItems = () => {
    const itemsToRemove = staleCartItems.filter(
      item => item.reason === 'out_of_stock' || item.reason === 'inactive'
    );

    itemsToRemove.forEach(item => {
      removeCartItem(item.cartKey);
    });

    if (itemsToRemove.length > 0) {
      toast.success(`${itemsToRemove.length} unavailable item(s) removed from cart`);
    }

    setShowStaleCartModal(false);
    setStaleCartItems([]);
  };

  const handleContinueShopping = () => {
    setShowStaleCartModal(false);
    setStaleCartItems([]);
  };


  // Check if there are any unavailable items (out of stock or slot unavailable)
  const hasUnavailableItems = outOfStockItems.length > 0 || Object.keys(unavailableItems).length > 0;

  if (!products || !cartItems) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row mt-16 min-h-screen gap-4 lg:gap-6 px-3 sm:px-4">
      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          user={user}
          initialData={selectedAddress}
          onAddressSaved={(newAddress) => {
            if (selectedAddress?._id === newAddress._id) {
              // Update existing
              setAddresses(prev => prev.map(addr => addr._id === newAddress._id ? newAddress : addr));
            } else {
              // Add new
              setAddresses(prev => [newAddress, ...prev]);
            }
            setSelectedAddress(newAddress);
            setShowAddressForm(false);
          }}
          onCancel={() => setShowAddressForm(false)}
        />
      )}

      {/* Stale Cart Modal */}
      <StaleCartModal
        isOpen={showStaleCartModal}
        onClose={handleContinueShopping}
        staleItems={staleCartItems}
        onRemoveStale={handleRemoveStaleItems}
        onContinueShopping={handleContinueShopping}
      />

      {/* Unavailable Items Modal */}
      <UnavailableItemsModal

        isOpen={showUnavailableModal}
        onClose={() => setShowUnavailableModal(false)}
        onRemove={removeAllUnavailableItems}
        items={Object.entries(unavailableItems).map(([key, reason]) => {
          const item = cartArray.find(i => i.cartKey === key);
          // Fallback if item is not found in cartArray, though it should be there
          return item ? { ...item, reason } : { cartKey: key, name: 'Unknown Item', reason };
        })}
      />

      {/* Gift Offer Choice Modal */}
      {showOfferModal && (
        <OfferSelectionModal
          offer={currentOffer}
          onApply={handleApplyGift}
          onClose={handleCloseOffer}
        />
      )}

      <ExclusivityModal
        isOpen={showExclusivityModal}
        onClose={() => setShowExclusivityModal(false)}
        onConfirm={confirmExclusivitySwitch}
        type={exclusivityType}
      />

      {isOfferMinimized && currentOffer && !selectedGift && (
        <OfferFloatingBubble
          offer={currentOffer}
          onClick={() => {
            setShowOfferModal(true);
            setIsOfferMinimized(false);
            // Remove from shown to reopen
            const filteredShown = shownThresholds.filter(t => t !== currentOffer.minOrderValue);
            setShownThresholds(filteredShown);
          }}
        />
      )}




      {/* Cart Items Section */}
      <div className="flex-1">
        <div className="flex flex-col mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Shopping Cart
            <span className="text-xs sm:text-sm text-green-600 font-medium ml-2 opacity-60">
              {Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)} Items
            </span>
          </h1>

          {/* Smart & Perfectly Aligned Micro-Bill for Mobile */}
          {cartArray.length > 0 && (
            <div
              onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="lg:hidden flex items-center justify-between bg-emerald-600/5 border border-emerald-600/10 px-4 py-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest leading-none mb-1">Total Bill</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xl font-black text-gray-900 leading-none">{currencySymbol}{totalAmount}</span>
                    {shippingFee > 0 && (
                      <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap tracking-tight">
                        ({currencySymbol}{roundedSubtotal - roundedDiscount} + {currencySymbol}{roundedShipping} Delivery)
                      </span>
                    )}
                  </div>
                </div>
                {totalSavings > 0 && (
                  <div className="hidden xs:flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-emerald-100 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">Saved {currencySymbol}{totalSavings}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-200/50">
                <span>Checkout</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Remove Unavailable Items Button */}
        {hasUnavailableItems && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={removeAllUnavailableItems}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove All Unavailable Items
            </button>
          </div>
        )}

        {/* Out of Stock Warning Banner */}
        <OutOfStockBanner
          outOfStockItems={outOfStockItems}
          removeCartItem={removeCartItem}
          removeOutOfStockItems={() => {
            if (outOfStockItems.length > 0) {
              outOfStockItems.forEach((item) => removeCartItem(item.cartKey));
              toast.success(`${outOfStockItems.length} out-of-stock item(s) removed.`);
              setOutOfStockItems([]);
            }
          }}
        />

        {/* Unavailable Items Warning Banner */}
        {Object.keys(unavailableItems).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <p className="text-orange-800 font-medium text-sm sm:text-base">
                    Some items are unavailable for the selected slot
                  </p>
                  <p className="text-orange-600 text-xs sm:text-sm">
                    These items cannot be delivered in your chosen time slot. Please remove them or choose a different delivery slot.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  Object.keys(unavailableItems).forEach(cartKey => removeCartItem(cartKey));
                  toast.success(`${Object.keys(unavailableItems).length} unavailable item(s) removed.`);
                  setUnavailableItems({});
                }}
                className="text-orange-700 hover:text-orange-900 text-sm font-medium whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {cartArray.length === 0 ? (
          <EmptyCart navigate={navigate} />
        ) : (
          <CartItemsList
            cartArray={cartArray}
            navigate={navigate}
            updateCartItem={updateCartItem}
            removeCartItem={removeCartItem}
            CURRENCY={CURRENCY}
            getProductImage={getProductImage}
            unavailableItems={unavailableItems}
          />
        )}
      </div>

      {/* Order Summary Section */}
      {cartArray.length > 0 && (
        <div ref={summaryRef} className="w-full lg:max-w-md">
          <OrderSummary
            user={user}
            addresses={addresses}
            selectedAddress={selectedAddress}
            loadingAddresses={loadingAddresses}
            setShowAddressForm={setShowAddressForm}
            paymentOption={paymentOption}
            setPaymentOption={setPaymentOption}
            deliveryDate={selectedSlot?.date || ""}
            setDeliveryDate={(date) => setSelectedSlot(prev => ({ ...prev, date }))}
            deliverySlot={selectedSlot?.timeSlot || ""}
            setDeliverySlot={(timeSlot) => setSelectedSlot(prev => ({ ...prev, timeSlot }))}
            subtotal={subtotal}
            totalMRP={totalMRP}
            totalSavings={totalSavings}
            shippingFee={shippingFee}
            tax={tax}
            totalAmount={totalAmount}
            currencySymbol={currencySymbol}
            placeOrder={placeOrder}
            isPlacingOrder={isPlacingOrder}
            outOfStockItems={outOfStockItems}
            unavailableItems={unavailableItems}
            hasUnavailableItems={hasUnavailableItems}
            instruction={instruction}
            setInstruction={setInstruction}
            selectedGift={selectedGift}
            removeGift={removeGift}
            // Promo Props
            applyPromo={applyPromoCode}
            removePromo={removePromoCode}
            promoCode={promoCode}
            discountAmount={discountAmount}
            // RG Coin Props
            userCoins={user?.rgCoins || 0}
            coinsUsed={coinsUsed}
            coinDiscount={coinDiscount}
            toggleCoins={toggleCoins}
            baseShippingFee={baseShippingFee}
            tipAmount={tipAmount}
            setTipAmount={setTipAmount}
            standardFee={standardFee}
            distanceSurcharge={distanceSurcharge}
            totalBeforeCoins={totalBeforeCoins}
            totalForThresholds={totalForThresholds}
            coinDebtRecovery={roundedCoinDebtRecovery}
            // Surge Surcharges
            surgeCharges={activeSurges}
          />
        </div>
      )}
      {/* Location Prompt Modal */}
      <LocationPrompt
        isOpen={showLocationPrompt}
        onAccept={handleAcceptLocation}
        onDismiss={() => setShowLocationPrompt(false)}
        isBlocked={isGeoBlocked}
      />
    </div>
  );
};

export default Cart;