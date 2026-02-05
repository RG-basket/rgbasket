import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import ProductCard from '../components/Products/ProductCard';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, ShoppingCart, Zap, AlertCircle } from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5
    }
  }
};

const ProductDetails = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const {
    products,
    currency,
    addToCart,
    removeCartItem,
    cartItems,
    getProductById,
    selectedSlot,
    checkProductAvailability
  } = useAppContext();

  // State management
  const [product, setProduct] = useState(null);
  const [thumbnail, setThumbnail] = useState('');
  const [productImages, setProductImages] = useState([]);
  const [selectedWeightIndex, setSelectedWeightIndex] = useState(0);

  // Helper to get numerical weight for sorting/comparison
  const getNumericalWeightValue = (w) => {
    if (!w) return 0;
    const val = parseFloat(w.weight) || 0;
    const unit = w.unit?.toLowerCase() || '';
    if (unit === 'kg' || unit === 'l') return val * 1000;
    return val;
  };

  // Create a sorted version of weights while keeping track of original index
  const weightOptions = (product?.weights || []).map((w, idx) => ({ ...w, originalIndex: idx }))
    .sort((a, b) => getNumericalWeightValue(a) - getNumericalWeightValue(b));
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  // Availability state
  const [isAvailableForSlot, setIsAvailableForSlot] = useState(true);
  const [unavailabilityReason, setUnavailabilityReason] = useState('');

  // Load product data
  useEffect(() => {
    if (products && products.length > 0) {
      const found = getProductById(productId);
      if (found) {
        setProduct(found);

        // Find smallest weight index for this product
        const options = (found.weights || []).map((w, idx) => ({ ...w, originalIndex: idx }))
          .sort((a, b) => {
            const getVal = (w) => {
              const v = parseFloat(w.weight) || 0;
              const u = w.unit?.toLowerCase() || '';
              if (u === 'kg' || u === 'l') return v * 1000;
              return v;
            };
            return getVal(a) - getVal(b);
          });

        if (options.length > 0) {
          setSelectedWeightIndex(options[0].originalIndex);
        }
      } else {
        setProduct(null);
      }
      setLoading(false);
    }
  }, [products, productId, getProductById]);

  // Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (product && selectedSlot && selectedSlot.date && selectedSlot.timeSlot) {
        const availability = await checkProductAvailability(
          product._id,
          selectedSlot.date,
          selectedSlot.timeSlot
        );
        setIsAvailableForSlot(availability.available);
        setUnavailabilityReason(availability.reason);
      } else {
        setIsAvailableForSlot(true);
        setUnavailabilityReason('');
      }
    };

    checkAvailability();
  }, [product, selectedSlot, checkProductAvailability]);

  // Load related products
  useEffect(() => {
    if (products && products.length > 0 && product) {
      const filtered = products.filter(
        (item) => item.category === product.category && item._id !== product._id
      );
      setRelatedProducts(
        filtered
          .sort((a, b) => {
            const aAvailable = (a.inStock && a.stock > 0) ? 1 : 0;
            const bAvailable = (b.inStock && b.stock > 0) ? 1 : 0;
            return bAvailable - aAvailable;
          })
          .slice(0, 5)
      );
    }
  }, [products, product]);

  // Set product images
  useEffect(() => {
    if (product) {
      const images = product.images || product.image || [];
      setProductImages(images);
      setThumbnail(images[0] || '');
    }
  }, [product]);

  // Inject Structured Data (JSON-LD) for Google Shopping
  useEffect(() => {
    if (!product) return;

    const defaultVariant = product.weights?.[0] || {};
    const price = defaultVariant.offerPrice || defaultVariant.price || 0;
    const availability = product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": (product.images || []).map(img => img.startsWith('http') ? img : `https://rgbasket.vercel.app${img.startsWith('/') ? '' : '/'}${img}`),
      "description": Array.isArray(product.description) ? product.description.join(' ') : product.description,
      "brand": {
        "@type": "Brand",
        "name": "RG Basket"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": price,
        "availability": availability,
        "itemCondition": "https://schema.org/NewCondition"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-json-ld';
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Update Meta Tags
    document.title = `${product.name} | RG Basket`;

    return () => {
      const existingScript = document.getElementById('product-json-ld');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [product]);

  // Calculate derived values
  const selectedWeight = product?.weights?.[selectedWeightIndex] || {};
  // Use weightIndex for cart key to match AppContext
  const cartKey = `${product?._id}_${selectedWeightIndex}`;
  const quantityInCart = cartItems[cartKey] || 0;

  // Check stock status for specific weight
  const isWeightInStock = selectedWeight?.inStock ?? product?.inStock ?? false;
  const weightStock = selectedWeight?.stock ?? product?.stock ?? 0;
  const isStockAvailable = isWeightInStock && weightStock > 0;

  // Overall availability
  const isAvailable = isStockAvailable && isAvailableForSlot;

  // Format weight display
  const formatWeight = (weightObj) => {
    if (!weightObj) return '';
    if (weightObj.unit === 'piece' || weightObj.unit === 'unit') {
      return '1 piece';
    }
    return `${weightObj.weight} ${weightObj.unit}`;
  };

  // Helper: return integer (no decimals)
  const formatPrice = (v) => {
    const n = Number(v) || 0;
    return Math.round(n);
  };

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(cartKey, 1);
  };

  // Handle Buy Now
  const handleBuyNow = () => {
    if (!isAvailable) return;
    if (quantityInCart === 0) {
      addToCart(cartKey, 1);
    }
    navigate("/cart");
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
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
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer w-16 h-16 md:w-20 md:h-20 ${thumbnail === image ? 'border-green-500' : 'border-gray-300'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <motion.div
              variants={itemVariants}
              className="flex-1 order-1 md:order-2"
            >
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white relative">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {!isStockAvailable && (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      Out of Stock
                    </span>
                  )}
                  {!isAvailableForSlot && isStockAvailable && (
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      Unavailable for Slot
                    </span>
                  )}
                </div>

                <img
                  src={thumbnail || 'https://via.placeholder.com/400x400?text=Product'}
                  alt={product.name}
                  className={`w-full h-80 sm:h-96 object-contain p-4 transition-opacity duration-300 ${!isAvailable ? 'opacity-75 grayscale-[0.5]' : ''}`}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Product Info */}
        <motion.div variants={itemVariants} className="flex-1">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-500 mt-1">{product.category}</p>

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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {weightOptions.map((w) => (
                    <button
                      key={w.originalIndex}
                      onClick={() => setSelectedWeightIndex(w.originalIndex)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedWeightIndex === w.originalIndex
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-200 text-gray-600'
                        }`}
                    >
                      {formatWeight(w)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Display */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-gray-700">Price:</span>
                {selectedWeight?.price > selectedWeight?.offerPrice ? (
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-green-700">
                      ₹{formatPrice(selectedWeight?.offerPrice)}
                    </p>
                    <p className="text-xl text-gray-400 line-through">
                      ₹{formatPrice(selectedWeight?.price)}
                    </p>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                      {Math.round(((selectedWeight?.price - selectedWeight?.offerPrice) / selectedWeight?.price) * 100)}% OFF
                    </span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-green-700">
                    ₹{formatPrice(selectedWeight?.offerPrice || selectedWeight?.price)}
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-500">(Inclusive of all taxes)</p>
            </div>

            {/* Order Limit Info */}
            {product.maxOrderQuantity > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg w-fit">
                <AlertCircle className="w-4 h-4" />
                <span>Limit: {product.maxOrderQuantity} {selectedWeight?.unit || 'pack(s)'} per order</span>
              </div>
            )}


            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Add to Cart / Quantity Controls */}
              <div className="flex-1">
                {quantityInCart > 0 ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl h-14 px-2">
                    <button
                      onClick={() => removeCartItem(cartKey)}
                      className="w-12 h-full flex items-center justify-center text-green-700 hover:bg-green-100 rounded-lg text-xl font-bold transition-colors"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold text-green-800">{quantityInCart}</span>
                    <button
                      onClick={() => addToCart(cartKey, 1)}
                      className="w-12 h-full flex items-center justify-center text-green-700 hover:bg-green-100 rounded-lg text-xl font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                    className={`w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!isAvailable
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-200'
                      }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                )}
              </div>

              {/* Buy Now Button */}
              <div className="flex-1">
                <button
                  onClick={handleBuyNow}
                  disabled={!isAvailable}
                  className={`w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${!isAvailable
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-orange-200'
                    }`}
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </button>
              </div>
            </div>

            {/* Availability Warning */}
            {!isAvailable && (
              <div className={`p-4 rounded-lg border ${!isStockAvailable ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                <p className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {!isStockAvailable ? 'Currently Out of Stock' : 'Unavailable for Selected Slot'}
                </p>
                {!isStockAvailable && (
                  <p className="text-sm mt-1 opacity-80">This item is currently out of stock. Please check back later.</p>
                )}
                {!isAvailableForSlot && isStockAvailable && (
                  <p className="text-sm mt-1 opacity-80">{unavailabilityReason || 'This product is not available for the selected delivery slot.'}</p>
                )}
              </div>
            )}

            {/* About Product (Collapsible) */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <button
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                className="flex items-center justify-between w-full text-left group"
              >
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">About Product</h3>
                {isDescriptionOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-green-700" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-green-700" />
                )}
              </button>

              <AnimatePresence>
                {isDescriptionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 text-gray-600 leading-relaxed space-y-2">
                      {Array.isArray(product.description) ? (
                        product.description.map((desc, index) => (
                          <p key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1.5">•</span>
                            <span>{desc}</span>
                          </p>
                        ))
                      ) : (
                        <p>{product.description || "No description available."}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
            <Link
              to={`/products/${product?.category?.toLowerCase() || 'uncategorized'}`}
              className="text-green-600 font-medium hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductDetails;