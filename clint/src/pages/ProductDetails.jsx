import { useEffect, useState } from "react";
import { useappcontext } from "../context/appcontext";
import { useParams, Link } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../components/Products/ProductCard";
import { motion } from "framer-motion";

const ProductDetails = () => {
  const { products, navigate, currency, addToCart, cartItems, updateCartItem } = useappcontext();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);
  const [isClicked, setIsClicked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (products && products.length > 0) {
      const found = products.find((item) => item._id === id);
      setProduct(found || null);
      setLoading(false);
    }
  }, [products, id]);

  useEffect(() => {
    if (products && products.length > 0 && product) {
      const filtered = products.filter(
        (item) => item.category === product.category && item._id !== product._id
      );
      setRelatedProducts(filtered.slice(0, 5));
    }
  }, [products, product]);

  useEffect(() => {
    if (product) {
      // Use images array first, fallback to image array
      const firstImage = product.images?.[0] || product.image?.[0];
      setThumbnail(firstImage || null);
    }
  }, [product]);

  // Get current cart quantity for this product variant
  useEffect(() => {
    if (product) {
      const selectedWeight = product.weights?.[selectedWeightIndex] || {};
      const cartKey = `${product._id}_${selectedWeight?.weight || 'default'}`;
      const currentQuantity = cartItems[cartKey] || 0;
      // Set quantity to current cart quantity or 1 if not in cart
      setQuantity(currentQuantity > 0 ? currentQuantity : 1);
    }
  }, [product, selectedWeightIndex, cartItems]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const imageVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    clicked: { 
      scale: [1, 0.95, 1],
      backgroundColor: "#059669",
      transition: {
        duration: 0.3
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  };

  const disabledButtonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1 },
    tap: { scale: 1 }
  };

  const quantityButtonVariants = {
    hover: { scale: 1.1, backgroundColor: "#10b981" },
    tap: { scale: 0.9 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/products")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Products
          </button>
        </motion.div>
      </div>
    );
  }

  const selectedWeight = product.weights?.[selectedWeightIndex] || {};
  const cartKey = `${product._id}_${selectedWeight?.weight || 'default'}`;
  const isOutOfStock = !product.inStock;
  const currentCartQuantity = cartItems[cartKey] || 0;
  
  // Get product images safely
  const productImages = product.images || product.image || [];
  
  // Format weight with unit
  const formatWeight = (weightObj) => {
    if (!weightObj) return '';
    const { weight, unit } = weightObj;
    if (!unit || unit === 'piece' || unit === 'unit') return weight;
    return `${weight} ${unit}`;
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) {
      // You can set a maximum limit
      return;
    }
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      // Add the specified quantity to cart
      for (let i = 0; i < quantity; i++) {
        addToCart(cartKey);
      }
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      // Add the specified quantity to cart
      for (let i = 0; i < quantity; i++) {
        addToCart(cartKey);
      }
      navigate("/cart");
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Breadcrumbs */}
      <motion.div variants={itemVariants} className="mb-8">
        <p className="text-sm text-gray-500">
          <Link to="/" className="hover:text-green-600 transition-colors">Home</Link> /{" "}
          <Link to="/products" className="hover:text-green-600 transition-colors">Products</Link> /{" "}
          <Link 
            to={`/products/${product.category?.toLowerCase() || 'uncategorized'}`}
            className="hover:text-green-600 transition-colors"
          >
            {product.category}
          </Link> /{" "}
          <span className="text-green-700 font-medium">
            {product.name}
          </span>
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Image Gallery */}
        <motion.div variants={itemVariants} className="flex-1">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="flex md:flex-col gap-2 order-2 md:order-1">
                {productImages.map((image, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setThumbnail(image)}
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer w-16 h-16 md:w-20 md:h-20 ${
                      thumbnail === image ? 'border-green-500' : 'border-gray-300'
                    }`}
                  >
                    <img 
                      src={`${import.meta.env.VITE_API_URL}${image}`}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <motion.div
              variants={imageVariants}
              className="flex-1 order-1 md:order-2"
            >
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white relative">
                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <p className="text-lg font-semibold text-red-600 bg-white/80 px-4 py-2 rounded shadow">
                      Out of Stock
                    </p>
                  </div>
                )}
                <img
                  src={thumbnail ? `${import.meta.env.VITE_API_URL}${thumbnail}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg=='}
                  alt={product.name}
                  className="w-full h-80 sm:h-96 object-contain p-4"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb2R1Y3Q8L3RleHQ+Cjwvc3ZnPg==';
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div variants={itemVariants} className="flex-1">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>
                {/* Out of Stock Badge */}
                {isOutOfStock && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-1 mt-2">
                {Array(5)
                  .fill("")
                  .map((_, i) => (
                    <img
                      key={i}
                      src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                      alt="rating"
                      className="w-5 h-5"
                    />
                  ))}
                <span className="text-gray-600 ml-2">(4.0)</span>
              </div>
            </div>

            {/* Weight Selector */}
            {product.weights?.length > 0 && (
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Weight
                </label>
                <select
                  value={selectedWeightIndex}
                  onChange={(e) => setSelectedWeightIndex(Number(e.target.value))}
                  disabled={isOutOfStock}
                  className={`w-full max-w-xs border-2 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:border-transparent ${
                    isOutOfStock 
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                >
                  {product.weights.map((w, i) => (
                    <option key={i} value={i}>
                      {formatWeight(w)}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            {/* Quantity Selector */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <motion.button
                  variants={isOutOfStock ? disabledButtonVariants : quantityButtonVariants}
                  whileHover={isOutOfStock ? "hover" : "hover"}
                  whileTap={isOutOfStock ? "tap" : "tap"}
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={isOutOfStock || quantity <= 1}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                    isOutOfStock || quantity <= 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  -
                </motion.button>
                
                <motion.span 
                  className="w-12 text-center text-lg font-semibold text-gray-800"
                  key={quantity}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {quantity}
                </motion.span>
                
                <motion.button
                  variants={isOutOfStock ? disabledButtonVariants : quantityButtonVariants}
                  whileHover={isOutOfStock ? "hover" : "hover"}
                  whileTap={isOutOfStock ? "tap" : "tap"}
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={isOutOfStock || quantity >= 10}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                    isOutOfStock || quantity >= 10
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  +
                </motion.button>

                {/* Current cart quantity indicator */}
                {currentCartQuantity > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium"
                  >
                    {currentCartQuantity} in cart
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Maximum 10 units per order
              </p>
            </motion.div>

            {/* Price Display */}
            <motion.div variants={itemVariants} className="space-y-2">
              {selectedWeight?.price > selectedWeight?.offerPrice ? (
                <div className="flex items-center gap-4">
                  <p className={`text-2xl lg:text-3xl font-bold ${
                    isOutOfStock ? 'text-gray-400' : 'text-green-700'
                  }`}>
                    {currency} {selectedWeight?.offerPrice}
                  </p>
                  <p className="text-xl text-gray-500 line-through">
                    {currency} {selectedWeight?.price}
                  </p>
                  {!isOutOfStock && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                      Save {currency} {selectedWeight?.price - selectedWeight?.offerPrice}
                    </span>
                  )}
                </div>
              ) : (
                <p className={`text-2xl lg:text-3xl font-bold ${
                  isOutOfStock ? 'text-gray-400' : 'text-green-700'
                }`}>
                  {currency} {selectedWeight?.offerPrice || selectedWeight?.price}
                </p>
              )}
              
              {/* Total Price for Selected Quantity */}
              <div className="flex items-center gap-2">
                <p className={`text-sm ${
                  isOutOfStock ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total for {quantity} item{quantity > 1 ? 's' : ''}:
                </p>
                <p className={`text-lg font-semibold ${
                  isOutOfStock ? 'text-gray-400' : 'text-green-700'
                }`}>
                  {currency} {((selectedWeight?.offerPrice || selectedWeight?.price) * quantity).toFixed(2)}
                </p>
              </div>
              
              <p className={`text-sm ${
                isOutOfStock ? 'text-gray-400' : 'text-gray-600'
              }`}>
                (inclusive of all taxes)
              </p>
              {selectedWeight?.unit && selectedWeight.unit !== 'piece' && selectedWeight.unit !== 'unit' && (
                <p className={`text-sm ${
                  isOutOfStock ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Price per {selectedWeight.unit}
                </p>
              )}
            </motion.div>

            {/* Product Description */}
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">About Product</h3>
              <div className="space-y-2 text-gray-700">
                {Array.isArray(product.description) ? (
                  product.description.map((desc, index) => (
                    <p key={index} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {desc}
                    </p>
                  ))
                ) : (
                  <p>{product.description || "No description available."}</p>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                variants={isOutOfStock ? disabledButtonVariants : buttonVariants}
                initial="initial"
                animate={isClicked ? "clicked" : "initial"}
                whileHover={isOutOfStock ? "hover" : "hover"}
                whileTap={isOutOfStock ? "tap" : "clicked"}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isClicked
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {isOutOfStock 
                  ? "Out of Stock" 
                  : isClicked 
                  ? <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added {quantity} to Cart!
                    </>
                  : `Add ${quantity} to Cart`
                }
              </motion.button>

              <motion.button
                variants={isOutOfStock ? disabledButtonVariants : {}}
                whileHover={isOutOfStock ? {} : { scale: 1.02 }}
                whileTap={isOutOfStock ? {} : { scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`flex-1 py-4 font-semibold rounded-lg transition-colors ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isOutOfStock ? "Unavailable" : `Buy ${quantity} Now`}
              </motion.button>
            </motion.div>

            {/* Stock Status Message */}
            {isOutOfStock && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> This product is currently out of stock. Check back later or explore similar products below.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Products</h2>
            <div className="w-24 h-1 bg-green-600 rounded-full mx-auto"></div>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          >
            {relatedProducts
              .filter((product) => product.inStock)
              .map((product, index) => (
                <ProductCard key={product._id} product={product} />
              ))}
          </motion.div>

          <div className="text-center mt-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigate("/products");
                window.scrollTo(0, 0);
              }}
              className="px-12 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors font-medium"
            >
              View All Products
            </motion.button>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
};

export default ProductDetails;