import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { useAppContext } from "../../context/AppContext";
import toast from 'react-hot-toast';

const ProductSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-3 w-full h-64 flex flex-col animate-pulse">
    <div className="w-full h-32 bg-gray-50 rounded-lg mb-3" />
    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
    <div className="mt-auto h-8 bg-gray-100 rounded-xl w-full" />
  </div>
);

const Categories = () => {
  const navigate = useNavigate();
  const { refreshProducts } = useAppContext();

  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(''); // Category slug
  const [activeTabName, setActiveTabName] = useState(''); // Category name
  const [products, setProducts] = useState([]); // Raw products for active category
  const [filteredProducts, setFilteredProducts] = useState([]); // Filtered products

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState('');

  const [sortOption, setSortOption] = useState('name-a-z');
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sortOptions = [
    { value: 'default', label: 'Recommended' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'name-a-z', label: 'Name: A to Z' },
  ];

  // 1. Fetch Categories list on mount & Randomly select one
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setError('');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.categories)) {
          const processedCats = data.categories.map((cat, index) => ({
            _id: cat._id || `category-${index}`,
            name: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
            emoji: cat.emoji || '📦',
            productCount: cat.productCount || 0
          }));

          setCategories(processedCats);

          if (processedCats.length > 0) {
            // Randomly select an initial category to display
            const randomIndex = Math.floor(Math.random() * processedCats.length);
            const randomCat = processedCats[randomIndex];
            setActiveTab(randomCat.slug);
            setActiveTabName(randomCat.name);
          }
        } else {
          setError('Failed to fetch categories list.');
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Error connecting to server to load categories.');
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // 2. Fetch products ONLY for the active category
  useEffect(() => {
    if (!activeTabName) return;

    const fetchCategoryProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/products?category=${encodeURIComponent(activeTabName)}&limit=1000`
        );
        const data = await res.json();
        
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          applyFiltersAndSorting(data.products);
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (err) {
        console.error('Failed to load products for category:', err);
        toast.error('Failed to load products for this category.');
      } finally {
        setProductsLoading(false);
      }
    };

    fetchCategoryProducts();

    // Sync Intent to Backend (Browsed Category)
    const syncCategoryIntent = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      try {
        const user = JSON.parse(userStr);
        const userId = user.id || user._id;
        await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/intent`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: activeTab })
        });
      } catch (err) {
        console.debug('Category intent sync skipped');
      }
    };
    syncCategoryIntent();

  }, [activeTabName]);

  // 3. Apply sorting and out of stock filtering locally
  const applyFiltersAndSorting = (productsList) => {
    let filtered = [...productsList];

    // Filter out-of-stock products if needed
    if (!showOutOfStock) {
      filtered = filtered.filter(product => {
        const inStock = product.inStock && product.stock > 0;
        const weightInStock = product.weights?.some(weight => weight.inStock && weight.stock > 0);
        return inStock || weightInStock;
      });
    }

    // Apply sorting
    filtered = sortProducts(filtered, sortOption);
    setFilteredProducts(filtered);
  };

  // Re-apply filters locally when sorting or toggle options change
  useEffect(() => {
    applyFiltersAndSorting(products);
  }, [sortOption, showOutOfStock, products]);

  // Sort helper
  const sortProducts = (productsList, option) => {
    const sorted = [...productsList];

    switch (option) {
      case 'price-low-high':
        return sorted.sort((a, b) => {
          const priceA = a.weights?.[0]?.offerPrice || a.weights?.[0]?.price || 0;
          const priceB = b.weights?.[0]?.offerPrice || b.weights?.[0]?.price || 0;
          return priceA - priceB;
        });

      case 'price-high-low':
        return sorted.sort((a, b) => {
          const priceA = a.weights?.[0]?.offerPrice || a.weights?.[0]?.price || 0;
          const priceB = b.weights?.[0]?.offerPrice || b.weights?.[0]?.price || 0;
          return priceB - priceA;
        });

      case 'name-a-z':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      case 'name-z-a':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));

      case 'default':
      default:
        return sorted;
    }
  };

  // Switch category
  const handleCategorySelect = (category) => {
    setActiveTab(category.slug);
    setActiveTabName(category.name);
  };

  // Toggle out-of-stock
  const handleOutOfStockToggle = () => {
    setShowOutOfStock(prev => !prev);
  };

  // Manual refresh
  const handleManualRefresh = async () => {
    if (!activeTabName) return;
    setProductsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products?category=${encodeURIComponent(activeTabName)}&limit=1000`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        toast.success('Category refreshed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Scroll to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (categoriesLoading) {
    return (
      <div className='min-h-screen bg-gray-50 py-4 flex items-center justify-center'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='text-center bg-white rounded-2xl p-6 shadow-lg max-w-md w-full border border-gray-100'>
          <div className='text-red-500 text-4xl mb-3'>⚠️</div>
          <h3 className='text-lg font-bold text-gray-800 mb-2'>Failed to load</h3>
          <p className='text-gray-600 mb-4 text-sm'>{error}</p>
          <button onClick={() => window.location.reload()} className='bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-bold text-xs shadow-md'>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50/50 py-4'>
      <div className='max-w-7xl mx-auto px-4'>

        {/* Premium Grid Category Selector */}
        <div className="bg-white rounded-3xl p-3 sm:p-5 mb-4 border border-gray-100/80 shadow-sm overflow-hidden">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
            Categories
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-4">
            {categories.map((cat) => {
              const isActive = activeTab === cat.slug;
              return (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all duration-200 min-h-16 h-auto sm:h-20 w-full ${
                    isActive
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105'
                      : 'bg-gray-50/60 border-gray-100 text-gray-600 hover:bg-emerald-50/30 hover:border-emerald-200'
                  }`}
                >
                  <span className="text-xl sm:text-2xl mb-0.5">{cat.emoji}</span>
                  <span className={`text-[8px] sm:text-xs font-bold leading-tight text-center break-all sm:break-normal whitespace-normal w-full max-w-full ${
                    isActive ? 'text-white' : 'text-gray-700'
                  }`}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Header Bar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-2 mb-4 shadow-sm flex flex-row items-center justify-between gap-2">
          
          {/* Left: Info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
              <span className="text-base">
                {categories.find(c => c.slug === activeTab)?.emoji || '📦'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-gray-900 truncate leading-none">
                {activeTabName || 'Category'}
              </h1>
              <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                {productsLoading ? 'Loading...' : `${filteredProducts.length} Results`}
              </p>
            </div>
          </div>

          {/* Right: Controls inline */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort custom dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all border flex items-center gap-1 ${
                  showSortDropdown ? 'bg-white border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-600'
                }`}
              >
                <span className="max-w-[65px] sm:max-w-none truncate">
                  {sortOptions.find(o => o.value === sortOption)?.label.replace('Name: ', '').replace('Price: ', '')}
                </span>
                <svg className={`w-2.5 h-2.5 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl z-30 w-36 py-1"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortOption(opt.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left hover:bg-emerald-50 text-[10px] font-bold transition-colors ${
                          sortOption === opt.value ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

            {/* Availability Toggle */}
            <button
              onClick={handleOutOfStockToggle}
              className={`px-2 py-1.5 rounded-lg text-[9px] font-black border transition-all flex items-center gap-1 ${
                !showOutOfStock ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <div className={`w-1 h-1 rounded-full ${!showOutOfStock ? 'bg-white' : 'bg-gray-300'}`} />
              <span>{!showOutOfStock ? 'In Stock' : 'All'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={productsLoading}
              className={`p-1.5 rounded-lg transition-all ${
                productsLoading ? 'bg-gray-100 text-gray-400 animate-spin' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className='mb-8'>
          {productsLoading ? (
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6">
              {[...Array(12)].map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className='text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm'>
              <div className='text-5xl mb-4'>🔍</div>
              <h3 className='text-lg font-bold text-gray-800 mb-1'>No Products Found</h3>
              <p className='text-gray-500 text-xs mb-6'>Try changing your filters or checking back later.</p>
              <button
                onClick={() => {
                  setShowOutOfStock(true);
                  setSortOption('default');
                }}
                className='bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all'
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6"
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-50 w-12 h-12 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all border-4 border-white/20 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </div>
  );
};

export default Categories;