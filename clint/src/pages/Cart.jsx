import { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useappcontext } from "../context/appcontext";
import ScheduledDeliverySelector from "../components/Servicibility/ScheduledDeliverySelector";
import { motion } from 'framer-motion';
import { Plus } from "lucide-react";
import AddressForm from "../components/Address/AddressForm";
import toast from "react-hot-toast";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    removeCartItem,
    getCartCount,
    updateCartItem,
    navigate,
    getCartAmount,
    user,
    setCartItems
  } = useappcontext();

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

  const getCart = () => {
    let tempArray = [];

    for (const key in cartItems) {
      const [productId, weightLabel] = key.split("_");
      const product = products.find((item) => item._id === productId);
      const variant = product?.weights?.find((w) => w.weight === weightLabel);

      if (product && variant) {
        tempArray.push({
          ...product,
          weight: weightLabel,
          offerPrice: variant.offerPrice,
          price: variant.price,
          quantity: cartItems[key],
          cartKey: key,
        });
      }
    }

    setCartArray(tempArray);
  };

  const placeOrder = async () => {
    // Check if address is available
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

    // Check if all items are in stock
    if (!checkStockStatus()) {
      toast.error("Some items in your cart are out of stock. Please remove them to continue.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderItems = cartArray.map(item => ({
        productId: item._id,
        name: item.name,
        description: Array.isArray(item.description)
          ? item.description.join(', ')
          : (item.description || `${item.name} - ${item.weight}`),
        weight: item.weight,
        quantity: item.quantity,
        price: item.offerPrice || item.price,
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
        deliveryDate,
        timeSlot: deliverySlot,
        userId: user?.id || user?._id,
        userInfo: {
          name: user?.name || 'Guest',
          email: user?.email || '',
          photo: user?.photo || '',
          phone: selectedAddress.phoneNumber
        }
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

        // Clear cart completely after successful order
        localStorage.removeItem('cartItems');

        // Force complete page refresh to ensure cart is cleared
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

  // Remove all out-of-stock items using appcontext's removeCartItem
const removeOutOfStockItems = () => {
  if (outOfStockItems.length === 0) {
    toast.error("No out-of-stock items to remove.");
    return;
  }

  outOfStockItems.forEach((item) => {
    removeCartItem(item.cartKey); // use appcontext method to remove from cart
  });

  toast.success(`${outOfStockItems.length} out-of-stock item(s) removed.`);
  setOutOfStockItems([]); // clear local state
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
      const today = new Date();
      setDeliveryDate(today.toISOString().split("T")[0]);
    }
  }, []);

  // Check stock status when cart array changes
  useEffect(() => {
    if (cartArray.length > 0) {
      checkStockStatus();
    }
  }, [cartArray]);

  // Calculate totals
  const subtotal = getCartAmount();
  const shippingFee = cartArray.length > 0 ? 29 : 0;
  const tax = 0;
  const totalAmount = subtotal + shippingFee + tax;

  // Safe image URL getter
  const getProductImage = (product) => {
    if (product.images?.[0]) {
      return `${import.meta.env.VITE_API_URL}${product.images[0]}`;
    }
    if (product.image?.[0]) {
      return `${import.meta.env.VITE_API_URL}${product.image[0]}`;
    }
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
  };

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

      {/* Cart Items Section */}
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">
          Shopping Cart
          <span className="text-xs sm:text-sm text-green-600 ml-2">({getCartCount()} Items)</span>
        </h1>

        {/* Out of Stock Warning Banner */}
        {outOfStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-red-800 font-semibold text-sm">
                    {outOfStockItems.length} item(s) out of stock
                  </h3>
                </div>
                <p className="text-red-700 text-sm mb-3">
                  Remove out of stock items to place your order
                </p>
                <div className="space-y-2">
                  {outOfStockItems.map(item => (
                    <div key={item.cartKey} className="flex items-center justify-between bg-red-100 px-3 py-2 rounded">
                      <span className="text-red-800 text-sm font-medium">{item.name} - {item.weight}</span>
                      <button
                        onClick={() => removeCartItem(item.cartKey)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={removeOutOfStockItems}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Remove All Out of Stock
              </button>
            </div>
          </motion.div>
        )}

        {cartArray.length === 0 ? (
          <motion.div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-green-100 p-6 sm:p-8 text-center relative overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  ease: "easeOut"
                }
              }
            }}
          >
            <motion.div
              className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
            >
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </motion.div>

            <motion.h2
              className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Your cart is empty
            </motion.h2>

            <motion.p
              className="text-gray-600 mb-6 text-sm sm:text-base relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Add some fresh groceries to get started with your order
            </motion.p>

            <motion.button
              onClick={() => navigate('/products/all')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              Start Shopping
            </motion.button>
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-green-100 p-4 sm:p-6">
            {/* Header - Hidden on mobile, shown on desktop */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr] text-gray-600 text-sm font-medium pb-3 border-b border-green-200 mb-4">
              <p className="text-left">Product Details</p>
              <p className="text-center">Subtotal</p>
              <p className="text-center">Action</p>
            </div>

            {cartArray.map((product, index) => (
              <div
                key={index}
                className={`flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr] gap-3 sm:gap-0 text-gray-600 items-center text-sm font-medium py-3 border-b border-green-100 last:border-b-0 ${!product.inStock ? 'bg-red-50 border-red-200' : ''
                  }`}
              >
                {/* Product Details */}
                <div className="flex items-center gap-3 w-full">
                  <div
                    onClick={() => navigate(`/products/${product.category.toLowerCase()}/${product._id}`)}
                    className={`relative cursor-pointer w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center border rounded-lg overflow-hidden bg-white flex-shrink-0 ${!product.inStock ? 'border-red-300' : 'border-green-200'
                      }`}
                  >

                    <img
                      className="w-full h-full object-cover"
                      src={getProductImage(product)}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
                      }}
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-xs px-1 py-0.5 rounded font-bold">OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm sm:text-base ${!product.inStock ? 'text-red-700' : 'text-gray-900'
                        }`}>
                        {product.name}
                      </p>
                      {!product.inStock && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className={`text-xs sm:text-sm ${!product.inStock ? 'text-red-600' : 'text-gray-600'
                      }`}>
                      <p>Weight: <span className="font-medium">{product.weight}</span></p>
                      <div className="flex items-center mt-1">
                        <span className="mr-2">Qty:</span>
                        <select
                          onChange={(e) => updateCartItem(product.cartKey, Number(e.target.value))}
                          value={product.quantity}
                          disabled={!product.inStock}
                          className={`border rounded px-2 py-1 bg-white focus:ring-1 text-xs sm:text-sm ${!product.inStock
                              ? 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed'
                              : 'border-green-300 focus:ring-green-500'
                            }`}
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between sm:justify-center items-center w-full sm:w-auto">
                  <span className="sm:hidden text-xs font-medium text-gray-700">Subtotal:</span>
                  <p className={`font-semibold text-sm sm:text-base ${!product.inStock ? 'text-red-600 line-through' : 'text-gray-900'
                    }`}>
                    {currency}{(product.offerPrice * product.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Action Button */}
                <div className="flex justify-between sm:justify-center items-center w-full sm:w-auto">
                  <span className="sm:hidden text-xs font-medium text-gray-700">Remove:</span>
                  <button
                    onClick={() => removeCartItem(product.cartKey)}
                    className="cursor-pointer p-2 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                  >
                    <img
                      src={assets.remove_icon}
                      alt="remove"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary Section */}
      {cartArray.length > 0 && (
        <div className="w-full lg:max-w-md bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 h-fit sticky top-20 lg:top-24">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

          {/* User Information */}
          {user && (
            <div className="mb-4 sm:mb-6 p-3 bg-white rounded-lg sm:rounded-xl border border-green-200">
              <p className="text-xs sm:text-sm font-medium text-green-700 mb-2">ORDERING AS</p>
              <div className="flex items-center space-x-2 sm:space-x-3">
                {user.photo ? (
                  <img
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-green-200"
                    src={user.photo}
                    alt={user.name}
                  />
                ) : (
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                    <span className="text-green-600 font-medium text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</p>
                  <p className="text-gray-500 text-xs sm:text-sm truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Address Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-medium text-green-700">DELIVERY ADDRESS</p>
              <motion.button
                onClick={() => setShowAddressForm(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
              >
                <span className="text-sm font-bold">+</span>
                Add / Change
              </motion.button>
            </div>

            {loadingAddresses ? (
              <div className="text-center py-3 bg-white rounded-lg sm:rounded-xl border border-green-200">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent mx-auto mb-2"></div>
                <p className="text-gray-500 text-xs sm:text-sm">Loading addresses...</p>
              </div>
            ) : addresses.length > 0 && selectedAddress ? (
              <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-green-300">
                <div className="flex justify-between items-start mb-1 sm:mb-2">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedAddress.fullName}</p>
                  {selectedAddress.isDefault && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                  )}
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">{selectedAddress.street}</p>
                <p className="text-gray-600 text-xs sm:text-sm mb-1">{selectedAddress.locality}, {selectedAddress.city}</p>
                <p className="text-gray-600 text-xs sm:text-sm">📞 {selectedAddress.phoneNumber}</p>
                {selectedAddress.alternatePhone && (
                  <p className="text-gray-600 text-xs sm:text-sm">📞 {selectedAddress.alternatePhone} (Alt)</p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-white rounded-lg sm:rounded-xl border-2 border-dashed border-green-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">Add Delivery Address</h3>
                <p className="text-gray-600 mb-3 text-xs sm:text-sm">Please add your delivery address</p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                >
                  Add Address Now
                </button>
              </div>
            )}
          </div>

          {/* Only show payment/delivery if address exists and no out of stock items */}
          {addresses.length > 0 && selectedAddress && outOfStockItems.length === 0 && (
            <>
              {/* Payment and Delivery */}
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-medium text-green-700 mb-2">PAYMENT METHOD</p>
                <select
                  onChange={(e) => setPaymentOption(e.target.value)}
                  value={paymentOption}
                  className="w-full border border-green-300 bg-white px-3 py-2 rounded-lg focus:ring-1 focus:ring-green-500 text-sm"
                >
                  <option value="COD">Cash On Delivery</option>
                 
                </select>

                <div className="mt-3">
                  <ScheduledDeliverySelector
                    selectedDate={deliveryDate}
                    setSelectedDate={setDeliveryDate}
                    selectedSlot={deliverySlot}
                    setSelectedSlot={setDeliverySlot}
                  />
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="text-gray-700 space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">{currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="text-green-600 font-semibold">{currency}{shippingFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (0%)</span>
                  <span>{currency}{tax.toFixed(2)}</span>
                </div>
                <hr className="border-green-200 my-2 sm:my-3" />
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Total Amount:</span>
                  <span className="text-green-700">{currency}{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Order Button */}
              <button
                onClick={placeOrder}
                disabled={isPlacingOrder || outOfStockItems.length > 0}
                className={`w-full py-3 text-white font-bold rounded-lg text-sm sm:text-base transition-colors min-h-[50px] ${isPlacingOrder || outOfStockItems.length > 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                {isPlacingOrder ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </div>
                ) : paymentOption === "COD" ? (
                  "Place Order"
                ) : (
                  "Proceed to Checkout"
                )}
              </button>
            </>
          )}

          {/* Warning when out of stock items exist */}
          {outOfStockItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-semibold text-sm">Cannot Place Order</p>
              </div>
              <p className="text-red-700 text-sm">
                Please remove {outOfStockItems.length} out of stock item(s) to continue with your order.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Cart;