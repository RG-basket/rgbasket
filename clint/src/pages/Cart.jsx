import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import AddressForm from "../components/Address/AddressForm";
import toast from "react-hot-toast";
import {
  OutOfStockBanner,
  EmptyCart,
  CartItemsList,
  OrderSummary,
  UnavailableItemsModal,
  ExclusivityModal

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
    navigate,
    getCartTotal,
    getCartAmount,
    user,
    setCartItems,
    selectedSlot,
    setSelectedSlot,
    validateCartForSlot,
    customizationData,
    getCustomizationCharge,
    serviceAreas
  } = useAppContext();

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
  const [orderLocation, setOrderLocation] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
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

  // Capture geolocation silently in background (admin-only feature)
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };



  // Tip state
  const [tipAmount, setTipAmount] = useState(0);

  // --- CALCULATE TOTALS EARLY TO AVOID REFERENCE ERRORS ---
  const subtotal = cartArray.reduce((acc, item) => acc + (item.offerPrice ?? item.price) * item.quantity + (item.customizationCharge || 0), 0);
  const totalMRP = cartArray.reduce((acc, item) => acc + (item.price || 0) * item.quantity + (item.customizationCharge || 0), 0);
  const totalSavings = totalMRP - subtotal;

  // Calculate Net Total before shipping to determine if fee applies
  // Convenience Fee (₹29) applies if (Subtotal - Discount) is strictly less than ₹299
  const netValueForShipping = subtotal - discountAmount;

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

  let totalAmount = roundedSubtotal + roundedShipping + roundedTax + roundedTip - roundedDiscount;
  if (totalAmount < 0) totalAmount = 0;
  totalAmount = Math.round(totalAmount * 100) / 100;


  // Sync Global -> Local

  // Sync Local -> Global logic removed. Using selectedSlot directly.

  // Automatically request location when entering cart
  useEffect(() => {
    const initLocation = async () => {
      if (!navigator.permissions) {
        // Fallback for browsers without permissions API
        const loc = await captureLocation();
        if (loc) setOrderLocation(loc);
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'granted') {
          const loc = await captureLocation();
          if (loc) setOrderLocation(loc);
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
            captureLocation().then(setOrderLocation);
          }
        };
      } catch (err) {
        console.warn("Permissions API error:", err);
      }
    };
    initLocation();
  }, []);

  const handleAcceptLocation = async () => {
    setShowLocationPrompt(false);
    const loc = await captureLocation();
    if (loc) {
      setOrderLocation(loc);
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

    if (!checkStockStatus()) {
      toast.error("Some items in your cart are out of stock. Please remove them to continue.");
      return;
    }

    if (Object.keys(unavailableItems).length > 0) {
      toast.error("Some items are unavailable for the selected slot. Please remove them to continue.");
      return;
    }

    // Nudge for location one last time if missing
    if (!orderLocation && !isGeoBlocked) {
      setShowLocationPrompt(true);
      toast.error("Please enable location for delivery status!");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Use existing captured location or capture now if not yet allowed
      console.log('📍 Getting location data for order...');
      const locationData = orderLocation || await captureLocation();
      console.log('📍 Location data ready:', locationData);

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

      const slotName = selectedSlot?.timeSlot?.split(' (')[0] || '';

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
        timeSlot: slotName,
        userId: user?.id || user?._id,
        userInfo: {
          name: user?.name || 'Guest',
          email: user?.email || '',
          photo: user?.photo || '',
          phone: selectedAddress.phoneNumber
        },
        instruction: instruction || "",
        promoCode: promoCode || null,
        selectedGift: selectedGift || null,
        tipAmount: tipAmount || 0,
        location: locationData
      };

      console.log('📦 Final order payload being sent:', orderData);




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

        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartInstruction');
        localStorage.removeItem('cartSelectedGift');
        localStorage.removeItem('cartAppliedOfferThreshold');
        setCartItems({});

        setInstruction("");

        setTimeout(() => {
          window.location.href = '/order-success';
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
    // Exclusivity Check: If promo is applied, ask to switch
    if (promoApplied) {
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
      // Switch from Gift to Promo
      setSelectedGift(null);
      setAppliedOfferThreshold(0);
      applyPromoCode(pendingPromo, false, true); // Added 'bypass' flag
    } else {
      // Switch from Promo to Gift
      removePromoCode();
      setSelectedGift(pendingGift);
      setAppliedOfferThreshold(currentOffer.minOrderValue);
      setShowOfferModal(false);
      setIsOfferMinimized(false);

      const newShown = [...shownThresholds, currentOffer.minOrderValue];
      setShownThresholds(newShown);
      sessionStorage.setItem('shownOfferThresholds', JSON.stringify(newShown));
      toast.success("Free gift selected!");
    }

    setShowExclusivityModal(false);
    setPendingPromo(null);
    setPendingGift(null);
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
      // Exclusivity Check: If gift is selected, ask to switch
      if (selectedGift && !silent && !bypassExclusivity) {
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
          onAddressSaved={(newAddress) => {
            setAddresses(prev => [newAddress, ...prev]);
            setSelectedAddress(newAddress);
            setShowAddressForm(false);
            toast.success('Address saved successfully!');
          }}
          onCancel={() => setShowAddressForm(false)}
        />
      )}

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
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
          Shopping Cart
          <span className="text-xs sm:text-sm text-green-600 ml-2">
            ({Object.values(cartItems).reduce((sum, qty) => sum + qty, 0)} Items)
          </span>
        </h1>

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
          baseShippingFee={baseShippingFee}
          tipAmount={tipAmount}
          setTipAmount={setTipAmount}
          standardFee={standardFee}
          distanceSurcharge={distanceSurcharge}
        />
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