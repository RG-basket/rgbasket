import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/Products/ProductCard';
import { ChevronDown, ArrowUpDown, ArrowDownAz, ArrowUpAz, ArrowDown01, ArrowUp01, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO/SEO.jsx';

const API_BASE = import.meta.env.VITE_API_URL;

const ProductsCategory = () => {
  const { products, selectedSlot, loading: globalLoading } = useAppContext();
  const { category } = useParams();
  const [categories, setCategories] = useState([]);
  const [searchCategory, setSearchCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular-desc');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/categories`);
        const data = await res.json();
        if (data.success) {
          const formatted = data.categories.map(cat => ({
            _id: cat._id,
            name: cat.name,
            emoji: cat.emoji,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-')
          }));
          setCategories(formatted);

          // Match URL slug to category
          const found = formatted.find(
            item => item.slug.toLowerCase() === category?.toLowerCase()
          );
          setSearchCategory(found || null);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchCategories();
    }
  }, [category]);

  // Filter products by category slug
  const filteredProducts = products.filter(
    product => product.category?.toLowerCase() === category?.toLowerCase()
  );

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Primary Sort: Availability (In Stock items first)
    // We assume 'inStock' is true and 'stock' > 0 for available items.
    const aAvailable = (a.inStock && a.stock > 0) ? 1 : 0;
    const bAvailable = (b.inStock && b.stock > 0) ? 1 : 0;

    if (aAvailable !== bAvailable) {
      return bAvailable - aAvailable; // Descending: Available (1) before Unavailable (0)
    }

    // Secondary Sort: User Selection
    switch (sortBy) {
      case 'price-asc':
        return (a.weights[0]?.offerPrice || 0) - (b.weights[0]?.offerPrice || 0);
      case 'price-desc':
        return (b.weights[0]?.offerPrice || 0) - (a.weights[0]?.offerPrice || 0);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'popular-desc':
        return (b.meta?.purchases || 0) - (a.meta?.purchases || 0);
      case 'popular-asc':
        return (a.meta?.purchases || 0) - (b.meta?.purchases || 0);
      default:
        return 0;
    }
  });

  const sortOptions = [
    { id: 'popular-desc', label: 'Most Popular', icon: TrendingUp },
    { id: 'price-asc', label: 'Price: Low to High', icon: ArrowUp01 },
    { id: 'price-desc', label: 'Price: High to Low', icon: ArrowDown01 },
    { id: 'name-asc', label: 'Name: A to Z', icon: ArrowDownAz },
    { id: 'name-desc', label: 'Name: Z to A', icon: ArrowUpAz },
    { id: 'popular-asc', label: 'Least Popular', icon: ArrowUpDown },
  ];

  // Skeleton loader
  if (loading || globalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(12)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10 px-4 md:px-8 lg:px-16 pb-12">
      {searchCategory && (
        <SEO
          title={`${searchCategory.name} - Fresh Grocery Delivery`}
          description={`Order fresh ${searchCategory.name} online from RGBasket. Best quality and fast delivery in Cuttack.`}
          keywords={`${searchCategory.name} online, ${searchCategory.name} delivery Cuttack, RG Basket`}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Compact Glassmorphism Header */}
        <div className="mb-6">
          {searchCategory ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-xl shadow-sm shrink-0">
                    {searchCategory.emoji}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2 capitalize">
                      {searchCategory.name}
                      <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded-md">{sortedProducts.length}</span>
                    </h1>
                    {/* Inline Slot Pill for Desktop */}
                    {selectedSlot && selectedSlot.date && (
                      <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span>Delivering: {selectedSlot.timeSlot} • {new Date(selectedSlot.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-emerald-500 transition-all text-[11px] font-bold group"
                  >
                    <ArrowUpDown size={12} className="text-emerald-500" />
                    <span className="text-gray-600 group-hover:text-emerald-600 hidden sm:inline">
                      {sortOptions.find(opt => opt.id === sortBy)?.label}
                    </span>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden">
                        {sortOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => { setSortBy(option.id); setIsSortOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-[11px] font-bold flex items-center gap-3 transition-colors ${sortBy === option.id ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:bg-gray-50'}`}
                          >
                            <option.icon size={14} />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile Slot Pill / Desktop Detailed Sub-banner */}
              {selectedSlot && selectedSlot.date && (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-100 rounded-lg text-emerald-600">
                      <TrendingUp size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800 leading-none">
                        Active Slot: {selectedSlot.timeSlot} • {new Date(selectedSlot.date).toLocaleDateString()}
                      </p>
                      <p className="text-[9px] text-emerald-600 font-medium mt-1">Available items filtered for this schedule</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🔍</div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Category Not Found</h1>
              <p className="text-gray-500 text-xs">The requested collection doesn't exist.</p>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6">
            {sortedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (searchCategory && !globalLoading) ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              📦
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No Products Available
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              We don't have any products in the {searchCategory.name} category yet.
              New items are added regularly, so please check back soon.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        ) : null}
      </div>
    </div >
  );
};

export default ProductsCategory;