import React, { useState, useEffect } from "react";
import { useappcontext } from "../../context/appcontext.jsx";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

const ProductCard = ({ product: initialProduct, productId }) => {
  const { 
    currency, 
    addToCart, 
    removeCartItem, 
    cartItems,
    getProductById,
    getProductStockStatus 
  } = useappcontext();
  
  const navigate = useNavigate();

  // Use product from context if productId is provided, otherwise use initialProduct
  const contextProduct = productId ? getProductById(productId) : initialProduct;
  const product = contextProduct || initialProduct;

  if (!product || !product._id || !product.name) return null;

  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const weights = product.weights || [];
  const selectedWeight = weights[selectedWeightIndex] || {};

  // ✅ REAL-TIME: Get stock status from context (updated every 30 seconds)
  const stockStatus = getProductStockStatus(product._id, selectedWeightIndex);
  const isAvailable = stockStatus.inStock && stockStatus.stock > 0;

  const baseUrl = import.meta.env.VITE_API_URL ;
  const imageUrl = product.images?.[0] ? `${baseUrl}${product.images[0]}` : null;

  useEffect(() => {
    if (weights.length > 0 && selectedWeightIndex >= weights.length) {
      setSelectedWeightIndex(0);
    }
  }, [weights.length, selectedWeightIndex]);

  const cartKey = `${product._id}_${selectedWeight?.weight || "default"}`;
  const quantity = cartItems[cartKey] || 0;

  const price = Number(selectedWeight?.price) || 0;
  const offerPrice = Number(selectedWeight?.offerPrice) || price;
  const discount = price > offerPrice ? price - offerPrice : 0;

  // new helper: return integer (no decimals). Use Math.round (or Math.trunc/Math.floor if you prefer)
  const formatPrice = (v) => {
    const n = Number(v) || 0;
    return Math.round(n);
  };

  const formatWeight = (weightObj) => {
    if (!weightObj) return "";
    const { weight, unit } = weightObj;
    if (!unit || unit === "piece" || unit === "unit") return weight;
    return `${weight}${unit}`;
  };

  const handleCardClick = () => {
    navigate(`/products/${product.category?.toLowerCase() || "uncategorized"}/${product._id}`);
    window.scrollTo(0, 0);
  };

  const handleCartAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="border border-emerald-100 rounded-lg px-3 py-1.5 bg-white/90 w-full max-w-[180px] min-w-[150px] sm:min-w-[160px] sm:max-w-[180px] mx-auto shadow-sm hover:shadow-md hover:border-yellow-200 transition relative">
      {/* Badges Container - Fixed positioning */}
      <div className="absolute top-2 left-0 right-0 z-10 flex justify-between items-start px-2 pointer-events-none">
        {/* Out of Stock - Left side */}
        {!isAvailable && (
          <div className="bg-red-100 text-red-700 text-[10px] font-semibold px-2 py-[2px] rounded-full shadow-sm max-w-[45%] truncate">
            Out of Stock
          </div>
        )}
        
        {/* Save Badge - Right side */}
        {discount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-2 py-[2px] rounded-full shadow-sm ml-auto">
            Save ₹{formatPrice(discount)}
          </div>
        )}
      </div>

      {/* Image Container with top padding for badges */}
      <div 
        className={`group cursor-pointer flex items-center justify-center px-2 mt-2 ${
          (!isAvailable || discount > 0) ? 'pt-6' : 'pt-0'
        }`} 
        onClick={handleCardClick}
      >
        {!imageError && imageUrl ? (
          <img
            className="group-hover:scale-105 transition w-full max-w-[80px] sm:max-w-[90px] object-contain"
            src={imageUrl}
            alt={product.name}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="text-gray-300 text-4xl sm:text-5xl">📦</div>
        )}
      </div>

      <div className="text-gray-500/70 text-sm mt-1.5">
        <p className="text-xs sm:text-sm">{product.category || "Category"}</p>
        <p
          className="text-gray-800 font-medium text-sm sm:text-base truncate w-full cursor-pointer"
          onClick={handleCardClick}
        >
          {product.name}
        </p>

        {weights.length > 0 && (
          <div className="mt-1.5 pb-1 border-b border-gray-200">
            <select
              value={selectedWeightIndex}
              onChange={(e) => setSelectedWeightIndex(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm text-emerald-700 focus:border-emerald-300 focus:ring-emerald-200 w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {weights.map((w, i) => (
                <option key={i} value={i}>
                  {formatWeight(w) || `Opt ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end justify-between mt-2 gap-1">
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm sm:text-base font-medium text-emerald-600 whitespace-nowrap">
              ₹{formatPrice(offerPrice)}
            </p>
            {price > offerPrice && (
              <span className="text-gray-400 text-xs line-through whitespace-nowrap">
                ₹{formatPrice(price)}
              </span>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            {quantity === 0 ? (
              <button
                className={`flex items-center justify-center gap-1 w-[65px] sm:w-[70px] h-[26px] sm:h-[28px] rounded text-xs font-medium transition ${
                  isAvailable
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-yellow-50 hover:border-yellow-300"
                    : "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                onClick={(e) => isAvailable && handleCartAction(e, () => addToCart(cartKey))}
                disabled={!isAvailable}
              >
                <FaShoppingCart className="w-3 h-3" />
                Add
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 w-[65px] sm:w-[70px] h-[26px] sm:h-[28px] bg-emerald-100 rounded select-none">
                <button
                  onClick={(e) => handleCartAction(e, () => removeCartItem(cartKey))}
                  className="text-xs font-bold px-2 hover:text-red-600"
                >
                  -
                </button>
                <span className="text-xs font-bold">{quantity}</span>
                <button
                  onClick={(e) => handleCartAction(e, () => addToCart(cartKey))}
                  className="text-xs font-bold px-2 hover:text-green-600"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;