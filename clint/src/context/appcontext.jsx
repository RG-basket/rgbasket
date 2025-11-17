import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import { auth, provider } from "../Firebase.js";
import { signInWithPopup, signOut } from "firebase/auth";
import axios from "axios";

export const appcontext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  // NEW: Real-time polling state
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Load auth state from localStorage on component mount
  useEffect(() => {
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
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      }
    };

    loadAuthState();
  }, []);

  // UPDATED: Enhanced fetch products with better error handling
 // UPDATED: Remove dummy products fallback completely
const fetchProducts = async (showToast = false) => {
  try {
    setLoading(true);
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
    
    if (response.data && (response.data.products || Array.isArray(response.data))) {
      const productsData = response.data.products || response.data;
      setProducts(productsData);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast.success('Products updated');
      }
    } else {
      // NO DUMMY PRODUCTS - set empty array
      setProducts([]);
      console.warn('API returned unexpected format, using empty products array');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    // NO DUMMY PRODUCTS - set empty array
    setProducts([]);
    if (showToast) {
      toast.error('Failed to fetch products');
    }
  } finally {
    setLoading(false);
  }
};

  // NEW: Start real-time polling for product updates
  const startProductPolling = () => {
    // Clear existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchProducts(false); // Silent update
    }, 30000);

    setPollingInterval(interval);
  };

  // NEW: Stop polling
  const stopProductPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // NEW: Manual refresh function
  const refreshProducts = () => {
    fetchProducts(true); // Show toast
  };

  // NEW: Get real-time product by ID
  const getProductById = (productId) => {
    return products.find(product => product._id === productId);
  };

  // NEW: Get real-time product stock status
  const getProductStockStatus = (productId, weightIndex = 0) => {
    const product = getProductById(productId);
    if (!product) return { inStock: false, stock: 0 };
    
    const weight = product.weights?.[weightIndex];
    return {
      inStock: weight?.inStock ?? product.inStock ?? false,
      stock: weight?.stock ?? product.stock ?? 0
    };
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

      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, userData);

      const userProfile = {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        id: user.uid,
      };

      // Save to state
      setUser(userProfile);
      setIsLoggedIn(true);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('isLoggedIn', 'true');
      
      setShowUserLogin(false);
      toast.success("Login successful");
      navigate("/profile");
    } catch (error) {
      console.error("Google login or server error:", error);

      if (error.response && error.response.status >= 500) {
        const user = error.config.data ? JSON.parse(error.config.data) : {};
        const userProfile = {
          name: user.name,
          email: user.email,
          photo: user.photo,
          id: user.googleId,
        };
        
        // Save to state and localStorage even in offline mode
        setUser(userProfile);
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userProfile));
        localStorage.setItem('isLoggedIn', 'true');
        
        setShowUserLogin(false);
        toast.success("Login successful (offline mode)");
        navigate("/profile");
      } else {
        toast.error("Google login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear state
      setUser(null);
      setIsLoggedIn(false);
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      
      toast.success("Logged out");
      navigate("/");
    }
  };

  const requireAuth = () => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      return false;
    }
    return true;
  };

  // UPDATED: Enhanced addToCart with real-time stock validation
  const addToCart = (itemKey, quantity = 1) => {
    const [productId, weightLabel] = itemKey.split("_");
    const product = getProductById(productId);
    
    if (!product) {
      toast.error("Product not found");
      return;
    }

    // Find the specific weight variant
    const weightIndex = product.weights?.findIndex(w => 
      w.weight === weightLabel || `${w.weight}${w.unit || ''}` === weightLabel
    );
    
    const stockStatus = getProductStockStatus(productId, weightIndex);
    
    if (!stockStatus.inStock || stockStatus.stock === 0) {
      toast.error("Product is out of stock");
      return;
    }

    const currentQuantity = cartItems[itemKey] || 0;
    const newQuantity = currentQuantity + quantity;

    // Check if exceeds available stock
    if (newQuantity > stockStatus.stock) {
      toast.error(`Only ${stockStatus.stock} items available in stock`);
      return;
    }

    let cartData = structuredClone(cartItems);
    cartData[itemKey] = newQuantity;
    setCartItems(cartData);
    toast.success("Added to cart");
  };

  const updateCartItem = (itemKey, quantity) => {
    const [productId, weightLabel] = itemKey.split("_");
    const product = getProductById(productId);
    
    if (product && quantity > 0) {
      // Find the specific weight variant
      const weightIndex = product.weights?.findIndex(w => 
        w.weight === weightLabel || `${w.weight}${w.unit || ''}` === weightLabel
      );
      
      const stockStatus = getProductStockStatus(productId, weightIndex);
      
      if (quantity > stockStatus.stock) {
        toast.error(`Only ${stockStatus.stock} items available in stock`);
        return;
      }
    }

    let cartData = structuredClone(cartItems);
    cartData[itemKey] = quantity;
    setCartItems(cartData);
    
    if (quantity === 0) {
      delete cartData[itemKey];
      toast.success("Removed from cart");
    } else {
      toast.success("Cart updated");
    }
  };

  const removeCartItem = (itemKey) => {
    let cartData = structuredClone(cartItems);
    if (cartData[itemKey]) {
      cartData[itemKey] -= 1;
      if (cartData[itemKey] === 0) {
        delete cartData[itemKey];
      }
    }
    setCartItems(cartData);
    toast.success("Removed from cart");
  };

  // NEW: Clear cart completely
  const clearCart = () => {
    setCartItems({});
    localStorage.removeItem('cartItems');
    toast.success("Cart cleared");
  };

  const getCartCount = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  // UPDATED: Handle real products from database with real-time data
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemKey in cartItems) {
      const [productId, weightLabel] = itemKey.split("_");
      const product = getProductById(productId);
      
      if (product && product.weights) {
        const variant = product.weights.find((w) => 
          w.weight === weightLabel || `${w.weight}${w.unit || ''}` === weightLabel
        );
        if (variant) {
          totalAmount += variant.offerPrice * cartItems[itemKey];
        }
      }
    }
    return Math.floor(totalAmount * 100) / 100;
  };

  // NEW: Get cart items with real-time product data
  const getCartItemsWithDetails = () => {
    const cartItemsWithDetails = [];
    
    for (const itemKey in cartItems) {
      const [productId, weightLabel] = itemKey.split("_");
      const product = getProductById(productId);
      
      if (product && product.weights) {
        const variant = product.weights.find((w) => 
          w.weight === weightLabel || `${w.weight}${w.unit || ''}` === weightLabel
        );
        
        if (variant) {
          cartItemsWithDetails.push({
            itemKey,
            product,
            variant,
            quantity: cartItems[itemKey],
            totalPrice: variant.offerPrice * cartItems[itemKey]
          });
        }
      }
    }
    
    return cartItemsWithDetails;
  };

  const addToRecentItems = (product) => {
    setRecentItems((prev) => {
      const exists = prev.find((item) => item._id === product._id);
      if (exists) return prev;
      return [product, ...prev].slice(0, 10);
    });
  };

  // UPDATED: Initialize products and start polling
  useEffect(() => {
    fetchProducts();
    startProductPolling();

    // Cleanup on unmount
    return () => {
      stopProductPolling();
    };
  }, []);

  const value = {
    navigate,
    currency,
    user,
    isLoggedIn,
    setIsLoggedIn,
    setUser,
    logout,
    showUserLogin,
    setShowUserLogin,
    loginWithGoogle,
    requireAuth,
    products,
    cartItems,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    recentItems,
    addToRecentItems,
    getCartAmount,
    getCartCount,
    loading,
    searchQuery,
    setSearchQuery,
    searchTriggered,
    setSearchTriggered,
    
    // NEW: Real-time product functions
    refreshProducts,
    getProductById,
    getProductStockStatus,
    getCartItemsWithDetails,
    lastUpdated,
    startProductPolling,
    stopProductPolling
  };

  return <appcontext.Provider value={value}>{children}</appcontext.Provider>;
};

export const useappcontext = () => useContext(appcontext);