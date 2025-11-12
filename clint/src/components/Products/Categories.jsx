import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductCard from './ProductCard'
import { useappcontext } from '../../context/appcontext' // Import context

const Categories = () => {
  const navigate = useNavigate()
  const { products: contextProducts, refreshProducts, lastUpdated } = useappcontext() // Get products from context

  const [categories, setCategories] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({})
  const [loading, setLoading] = useState(false) // Set to false since context handles loading
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [filteredProducts, setFilteredProducts] = useState([])

  // New state for enhanced features
  const [sortOption, setSortOption] = useState('default')
  const [showOutOfStock, setShowOutOfStock] = useState(true)
  const [uniqueCategories, setUniqueCategories] = useState([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Use products from context
  const products = contextProducts || []

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

      const dynamicCategories = Array.from(categorySet).map((category, index) => ({
        _id: `category-${index}`,
        name: category,
        slug: category.toLowerCase().replace(/\s+/g, '-')
      }))

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

  // Handle category filter change
  const handleCategoryFilter = (categorySlug) => {
    setActiveTab(categorySlug)
    setShowCategoryDropdown(false)

    let productsToFilter = []
    if (categorySlug === 'all') {
      productsToFilter = products
    } else {
      productsToFilter = categoryProducts[categorySlug] || []
    }

    applyFiltersAndSorting(productsToFilter)
  }

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option)
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
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Fruits': '🍎',
      'Vegetables': '🥦',
      'Dairy': '🥛',
      'Bakery': '🍞',
      'Beverages': '🥤',
      'Snacks': '🍿',
      'Meat': '🥩',
      'Seafood': '🐟',
      'Grains': '🌾',
      'Frozen': '🧊',
      'Household': '🏠',
      'Spices': '🌶️',
      'Seeds': '🌱',
      'Instant': '⚡',
      'Others': '📦'
    }
    return iconMap[categoryName] || '📦'
  }

  // Manual refresh function
  const handleManualRefresh = () => {
    refreshProducts()
  }

  // Safe array access
  const safeCategories = Array.isArray(uniqueCategories) ? uniqueCategories : []
  const safeProducts = Array.isArray(products) ? products : []

  // Use loading from context if needed
  const { loading: contextLoading } = useappcontext()
  const isLoading = loading || contextLoading

  if (isLoading && products.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 py-4'>
        <div className='max-w-7xl mx-auto px-3'>
          {/* Loading Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>

            {/* Filter Controls Skeleton */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <div className="flex flex-col gap-3">
                <div className="h-10 bg-gray-300 rounded"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>

            {/* Products Grid Skeleton */}
            <div className='grid grid-cols-2 gap-3'>
              {[...Array(6)].map((_, index) => (
                <div key={index} className='bg-white rounded-lg p-3'>
                  <div className='w-full h-24 bg-gray-300 rounded-lg mb-2'></div>
                  <div className='h-3 bg-gray-300 rounded w-3/4 mb-1'></div>
                  <div className='h-2 bg-gray-300 rounded w-1/2'></div>
                </div>
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-white rounded-xl p-6 shadow-lg max-w-md w-full'
        >
          <div className='text-red-500 text-4xl mb-3'>⚠️</div>
          <h3 className='text-lg font-bold text-gray-800 mb-2'>Oops! Something went wrong</h3>
          <p className='text-gray-600 mb-4 text-sm'>{error}</p>
          <button
            onClick={handleManualRefresh}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm'
          >
            Try Again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-4'>
      <div className='max-w-7xl mx-auto px-3'>

        {/* Header with Refresh Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className='text-center mb-6'
        >
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                Categories
              </h1>
              <p className='text-gray-600 text-sm'>
                Browse our products by category
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <div className="text-gray-600 text-sm mr-2">Refresh</div>
              <button
                onClick={handleManualRefresh}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                title="Refresh products"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Rest of your Categories component JSX remains the same */}
        {/* Mobile Category Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 relative"
        >
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getCategoryIcon(getCurrentCategoryName())}</span>
              <span className="font-medium text-gray-900">{getCurrentCategoryName()}</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showCategoryDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {/* All Products Option */}
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-100 ${activeTab === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
              >
                <span className="text-lg">📦</span>
                <div>
                  <div className="font-medium">All Products</div>
                  <div className="text-xs text-gray-500">({safeProducts.length} items)</div>
                </div>
              </button>

              {/* Category Options */}
              {safeCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryFilter(category.slug)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-gray-100 last:border-b-0 ${activeTab === category.slug ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                    }`}
                >
                  <span className="text-lg">{getCategoryIcon(category.name)}</span>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500">
                      ({categoryProducts[category.slug]?.length || 0} items)
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Filter and Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="space-y-4">
            {/* Sort Options */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Sort by
              </label>
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="default">Default</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A to Z</option>
                <option value="name-z-a">Name: Z to A</option>
              </select>
            </div>

            {/* Filter Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showOutOfStock"
                  checked={showOutOfStock}
                  onChange={handleOutOfStockToggle}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="showOutOfStock" className="text-sm text-gray-700">
                  Show out of stock
                </label>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {filteredProducts.length} items
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid - UPDATED: Pass only productId to ProductCard */}
        <motion.div
          key={`${activeTab}-${sortOption}-${showOutOfStock}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='mb-8'
        >
          {filteredProducts.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300'>
              <div className='text-gray-400 text-4xl mb-3'>
                {activeTab === 'all' ? '📦' : '😔'}
              </div>
              <h3 className='text-lg font-semibold text-gray-600 mb-2'>
                {activeTab === 'all'
                  ? 'No Products Available'
                  : `No products in ${getCurrentCategoryName()}`
                }
              </h3>
              <p className='text-gray-500 text-sm max-w-xs mx-auto mb-4'>
                {activeTab === 'all'
                  ? 'Check back later for new products.'
                  : 'We are adding more products soon.'
                }
              </p>
              <div className="flex flex-col gap-2">
                {activeTab !== 'all' && (
                  <button
                    onClick={() => handleCategoryFilter('all')}
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm'
                  >
                    Browse All Products
                  </button>
                )}
                {!showOutOfStock && (
                  <button
                    onClick={() => setShowOutOfStock(true)}
                    className='bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm'
                  >
                    Show Out of Stock
                  </button>
                )}
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className='grid 
  grid-cols-2        /* default: mobile */
  sm:grid-cols-2     /* ≥640px */
  md:grid-cols-4     /* ≥768px */
  lg:grid-cols-5     /* ≥1024px */
  xl:grid-cols-7     /* ≥1280px */
  gap-3
'
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  productId={product._id} // Pass only ID, ProductCard will get real-time data from context
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Categories