import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import { useAppContext } from "../../context/AppContext";
const Categories = () => {
  const navigate = useNavigate()
  const { products: contextProducts, refreshProducts, lastUpdated } = useAppContext() // Get products from context

  const [categories, setCategories] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({})
  const [loading, setLoading] = useState(false) // Set to false since context handles loading
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [filteredProducts, setFilteredProducts] = useState([])

  // New state for enhanced features
  const [sortOption, setSortOption] = useState('name-a-z')
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [uniqueCategories, setUniqueCategories] = useState([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Use products from context
  const products = contextProducts || []

  // Fetch categories from backend to get emojis
  const [modelCategories, setModelCategories] = useState([])
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  useEffect(() => {
    const fetchModelCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        const data = await res.json();
        if (data.success) {
          setModelCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchModelCategories();
  }, []);

  // Process categories and organize products when context products change
  useEffect(() => {
    if (products.length > 0) {
      processProductsData(products)
    }
  }, [products, lastUpdated]) // Re-process when products or lastUpdated changes

  const processProductsData = (productsData) => {
    try {
      const safeProducts = Array.isArray(productsData) ? productsData : []

      // Extract unique categories dynamically from products
      const categorySet = new Set()
      safeProducts.forEach(product => {
        if (product.category && typeof product.category === 'string') {
          categorySet.add(product.category.trim())
        }
      })

      const dynamicCategories = Array.from(categorySet).map((category, index) => {
        // Try to match with model categories to get emoji
        const matched = modelCategories.find(c => c.name.toLowerCase() === category.toLowerCase());
        return {
          _id: matched?._id || `category-${index}`,
          name: category,
          slug: category.toLowerCase().replace(/\s+/g, '-'),
          emoji: matched?.emoji || '📦'
        };
      })

      setUniqueCategories(dynamicCategories)
      setCategories(dynamicCategories)

      // Organize products by category
      const productsByCategory = { all: safeProducts }

      dynamicCategories.forEach(category => {
        const categorySlug = category.slug
        productsByCategory[categorySlug] = safeProducts.filter(product =>
          product.category?.toLowerCase() === category.name.toLowerCase()
        )
      })

      setCategoryProducts(productsByCategory)

      // Apply initial filter
      applyFiltersAndSorting(safeProducts)

    } catch (err) {
      console.error('Data processing error:', err)
      setError(`Failed to process data: ${err.message}`)
    }
  }

  // Hook processProductsData back to modelCategories change as well
  useEffect(() => {
    if (products.length > 0) {
      processProductsData(products)
    }
  }, [modelCategories]);

  // Apply filters and sorting
  const applyFiltersAndSorting = (productsList) => {
    let filtered = [...productsList]

    // Filter out-of-stock products if needed
    if (!showOutOfStock) {
      filtered = filtered.filter(product => {
        const inStock = product.inStock && product.stock > 0
        const weightInStock = product.weights?.some(weight => weight.inStock && weight.stock > 0)
        return inStock || weightInStock
      })
    }

    // Apply sorting
    filtered = sortProducts(filtered, sortOption)

    setFilteredProducts(filtered)
  }

  // Sort products based on selected option
  const sortProducts = (productsList, option) => {
    const sorted = [...productsList]

    switch (option) {
      case 'price-low-high':
        return sorted.sort((a, b) => {
          const priceA = a.weights?.[0]?.offerPrice || a.weights?.[0]?.price || 0
          const priceB = b.weights?.[0]?.offerPrice || b.weights?.[0]?.price || 0
          return priceA - priceB
        })

      case 'price-high-low':
        return sorted.sort((a, b) => {
          const priceA = a.weights?.[0]?.offerPrice || a.weights?.[0]?.price || 0
          const priceB = b.weights?.[0]?.offerPrice || b.weights?.[0]?.price || 0
          return priceB - priceA
        })

      case 'name-a-z':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

      case 'name-z-a':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))

      case 'default':
      default:
        return sorted
    }
  }

  const sortOptions = [
    { value: 'default', label: 'Recommended' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'name-a-z', label: 'Name: A to Z' },
  ];

  // Handle category filter change
  const handleCategoryFilter = (categorySlug) => {
    setActiveTab(categorySlug)
    setShowCategoryDropdown(false)

    let productsToFilter = []
    if (categorySlug === 'all') {
      productsToFilter = products
    } else {
      productsToFilter = categoryProducts[categorySlug] || []

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
            body: JSON.stringify({ category: categorySlug })
          });
        } catch (err) {
          console.debug('Category intent sync skipped');
        }
      };
      syncCategoryIntent();
    }

    applyFiltersAndSorting(productsToFilter)
  }

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option)
    setShowSortDropdown(false)
    applyFiltersAndSorting(
      activeTab === 'all' ? products : (categoryProducts[activeTab] || [])
    )
  }

  // Handle out-of-stock toggle
  const handleOutOfStockToggle = () => {
    setShowOutOfStock(!showOutOfStock)
    applyFiltersAndSorting(
      activeTab === 'all' ? products : (categoryProducts[activeTab] || [])
    )
  }

  // Update filtered products when dependencies change
  useEffect(() => {
    if (products.length > 0) {
      handleCategoryFilter(activeTab)
    }
  }, [activeTab, products, categoryProducts, sortOption, showOutOfStock])

  // Get current category name
  const getCurrentCategoryName = () => {
    if (activeTab === 'all') return 'All Products'
    const category = uniqueCategories.find(cat => cat.slug === activeTab)
    return category?.name || 'Category'
  }

  // Get category icon
  const getCategoryIcon = (categorySlug) => {
    if (categorySlug === 'all') return '📦';
    const category = uniqueCategories.find(cat => cat.slug === categorySlug)
    return category?.emoji || '📦'
  }

  // Manual refresh function
  const handleManualRefresh = () => {
    refreshProducts()
  }

  // Safe array access
  const safeCategories = Array.isArray(uniqueCategories) ? uniqueCategories : []
  const safeProducts = Array.isArray(products) ? products : []

  // Scroll to Top Logic
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Use loading from context if needed
  const { loading: contextLoading } = useAppContext()
  const isLoading = loading || contextLoading

  if (isLoading && products.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 py-4'>
        <div className='max-w-7xl mx-auto px-3'>
          <div className="animate-pulse">
            <div className="h-16 bg-white rounded-2xl mb-6"></div>
            <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3'>
              {[...Array(12)].map((_, index) => (
                <div key={index} className='bg-white rounded-xl p-3 h-48'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className='text-center bg-white rounded-xl p-6 shadow-lg max-w-md w-full'>
          <div className='text-red-500 text-4xl mb-3'>⚠️</div>
          <h3 className='text-lg font-bold text-gray-800 mb-2'>Oops! Something went wrong</h3>
          <p className='text-gray-600 mb-4 text-sm'>{error}</p>
          <button onClick={handleManualRefresh} className='bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm'>Try Again</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50/50 py-4'>
      <div className='max-w-7xl mx-auto px-4'>

        {/* Compact Glassmorphism Header Bar - NON-STICKY */}
        <div className="relative z-40 bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-2.5 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Left: Info & Refresh */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
              <span className="text-xl">{getCategoryIcon(activeTab)}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{getCurrentCategoryName()}</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{filteredProducts.length} Results</p>
            </div>
            <button
              onClick={handleManualRefresh}
              className={`ml-auto p-2 rounded-lg transition-all ${isLoading ? 'bg-gray-100 text-gray-400 animate-spin' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Right: Controls Dropdowns */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Category Custom Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowSortDropdown(false); }}
                className={`w-full sm:w-40 px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between gap-2 ${showCategoryDropdown ? 'bg-white border-emerald-500 text-emerald-600 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-white'}`}
              >
                <span className="truncate">Category</span>
                <svg className={`w-3 h-3 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)}></div>
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-full left-0 sm:right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 w-52 max-h-72 overflow-y-auto py-1.5 overflow-hidden">
                    <button onClick={() => handleCategoryFilter('all')} className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-emerald-50 transition-colors ${activeTab === 'all' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'}`}>
                      <span className="text-base text-emerald-500">📦</span>
                      <span className="text-[11px] font-bold">All Products</span>
                    </button>
                    {safeCategories.map((cat) => (
                      <button key={cat._id} onClick={() => handleCategoryFilter(cat.slug)} className={`w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-emerald-50 transition-colors ${activeTab === cat.slug ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'}`}>
                        <span className="text-base">{cat.emoji}</span>
                        <span className="text-[11px] font-bold truncate">{cat.name}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </div>

            {/* Sort Custom Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => { setShowSortDropdown(!showSortDropdown); setShowCategoryDropdown(false); }}
                className={`w-full sm:w-36 px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between gap-2 ${showSortDropdown ? 'bg-white border-emerald-500 text-emerald-600 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-white'}`}
              >
                <span className="truncate">{sortOptions.find(o => o.value === sortOption)?.label}</span>
                <svg className={`w-3 h-3 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 w-44 py-1.5">
                    {sortOptions.map((opt) => (
                      <button key={opt.value} onClick={() => handleSortChange(opt.value)} className={`w-full px-4 py-2 text-left hover:bg-emerald-50 text-[11px] font-bold transition-colors ${sortOption === opt.value ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'}`}>
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
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 shrink-0 ${!showOutOfStock ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${!showOutOfStock ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="whitespace-nowrap">{!showOutOfStock ? 'In Stock' : 'Show all'}</span>
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <motion.div key={`${activeTab}-${sortOption}-${showOutOfStock}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className='mb-8'>
          {filteredProducts.length === 0 && !isLoading ? (
            <div className='text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100'>
              <div className='text-5xl mb-4'>🔍</div>
              <h3 className='text-lg font-bold text-gray-800 mb-1'>No Products Found</h3>
              <p className='text-gray-500 text-xs mb-6'>Try changing your filters or checking back later.</p>
              <button onClick={() => { setActiveTab('all'); setShowOutOfStock(true); }} className='bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all'>Clear Filter</button>
            </div>
          ) : (
            <motion.div layout className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3'>
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} productId={product._id} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Scroll to Top Mini Button */}
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
  )
}

export default Categories