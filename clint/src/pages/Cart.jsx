import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import AddressForm from "../components/Address/AddressForm";
import toast from "react-hot-toast";
import {
  OutOfStockBanner,
  EmptyCart,
  CartItemsList,
  OrderSummary,
  UnavailableItemsModal
} from "../components/Cart";

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
    validateCartForSlot
  } = useAppContext();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentOption, setPaymentOption] = useState("COD");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [unavailableItems, setUnavailableItems] = useState({});
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [instruction, setInstruction] = useState(() => {
    return localStorage.getItem('cartInstruction') || "";
  });

  // Promo Code State
  const [promoCode, setPromoCode] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  // Persist instruction
  useEffect(() => {
    localStorage.setItem('cartInstruction', instruction);
  }, [instruction]);

  // Safe currency symbol
  const currencySymbol = CURRENCY || '₹';

  // Capture geolocation silently in background (admin-only feature)
  const captureLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          };
          resolve(locationData);
        },
        (error) => {
          // Silently fail - don't show any error to user
          resolve(null);
        },
        options
      );
    });
  };

  // Sync Global -> Local
  useEffect(() => {
    if (selectedSlot) {
      if (selectedSlot.date && selectedSlot.date !== deliveryDate) {
        setDeliveryDate(selectedSlot.date);
      }
      if (selectedSlot.timeSlot && selectedSlot.timeSlot !== deliverySlot) {
        setDeliverySlot(selectedSlot.timeSlot);
      }
    }
  }, [selectedSlot]);

  // Sync Local -> Global
  useEffect(() => {
    if (deliveryDate && deliverySlot) {
      // Only update if different to avoid loops
      if (selectedSlot?.date !== deliveryDate || selectedSlot?.timeSlot !== deliverySlot) {
        setSelectedSlot({
          date: deliveryDate,
          timeSlot: deliverySlot,
          slotId: selectedSlot?.slotId // Preserve ID if possible
        });
      }
    }
  }, [deliveryDate, deliverySlot]);

  // Validate saved slot on Cart mount (important for midnight transitions)
  useEffect(() => {
    const validateSavedSlot = () => {
      if (!selectedSlot || !selectedSlot.date) return;

      // Parse slot date as IST
      const parseISTDate = (dateString) => {
        return new Date(dateString + 'T00:00:00+05:30');
      };

      const slotDate = parseISTDate(selectedSlot.date);
      slotDate.setHours(0, 0, 0, 0);

      const today = getISTDate();
      today.setHours(0, 0, 0, 0);

      // If slot date is in the past, clear it and set to tomorrow
      if (slotDate < today) {
        console.log('🔄 Saved slot expired, updating to tomorrow');
        const tomorrow = getISTDate();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(getISTDateString(tomorrow));
        setDeliverySlot(''); // Clear slot to force re-selection
        toast.info('Your saved delivery date has passed. Please select a new slot.');
      }
    };

    validateSavedSlot();
  }, []); // Run once on mount

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
        tempArray.push({
          ...product,
          weight: variant.weight,
          unit: variant.unit,
          offerPrice: variant.offerPrice,
          price: variant.price,
          quantity: cartItems[key],
          cartKey: key,
          inStock: variant.inStock !== false
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

    if (!deliveryDate || !deliverySlot) {
      toast.error("Please select both delivery date and time slot.");
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

    setIsPlacingOrder(true);

    try {
      // Silently capture location in background (no user notification)
      const locationData = await captureLocation();
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
        image: item.images?.[0] || item.image?.[0] || '',
        userName: user?.name || 'Guest',
        userImage: user?.photo || ''
      }));

      const slotName = deliverySlot.split(' (')[0];

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
        deliveryDate,
        timeSlot: slotName,
        userId: user?.id || user?._id,
        userInfo: {
          name: user?.name || 'Guest',
          email: user?.email || '',
          photo: user?.photo || '',
          phone: selectedAddress.phoneNumber
        },
        instruction,
        promoCode: promoApplied ? promoCode : null
      };

      // Silently add location data if captured (user never sees this)
      if (locationData) {
        orderData.location = locationData;
      }

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
  }, [products, cartItems]);

  useEffect(() => {
    if (!deliveryDate) {
      // Get tomorrow's date in IST
      const tomorrow = getISTDate();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDeliveryDate(getISTDateString(tomorrow));
    }
  }, []);

  useEffect(() => {
    if (cartArray.length > 0) {
      checkStockStatus();
    }
  }, [cartArray]);

  // Calculate totals
  const subtotal = cartArray.reduce((acc, item) => acc + (item.offerPrice ?? item.price) * item.quantity, 0);
  const totalMRP = cartArray.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);
  const totalSavings = totalMRP - subtotal;

  const shippingFee = cartArray.length > 0 ? (subtotal > 300 ? 0 : 29) : 0;
  const tax = 0;
  // Dynamic Total
  let totalAmount = subtotal + shippingFee + tax - discountAmount;
  if (totalAmount < 0) totalAmount = 0;

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

  const applyPromoCode = async (code, silent = false) => {
    try {
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
          return item ? { ...item, reason } : { cartKey: key, name: 'Unknown Item', reason };
        })}
      />

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
          deliveryDate={deliveryDate}
          setDeliveryDate={setDeliveryDate}
          deliverySlot={deliverySlot}
          setDeliverySlot={setDeliverySlot}
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

          // Promo Props
          applyPromo={applyPromoCode}
          removePromo={removePromoCode}
          promoCode={promoCode}
          discountAmount={discountAmount}
        />
      )}
    </div>
  );
};

export default Cart;