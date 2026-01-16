import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/Products/ProductCard';
import { ChevronDown, ArrowUpDown, ArrowDownAz, ArrowUpAz, ArrowDown01, ArrowUp01, TrendingUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

const ProductsCategory = () => {
  const { products, selectedSlot } = useAppContext();
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
  if (loading) {
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
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          {searchCategory ? (
            <div className="space-y-4">
              <div className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-xl md:text-2xl shadow-sm shrink-0">
                    {searchCategory.emoji}
                  </div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-bold text-gray-900 capitalize leading-tight">
                      {searchCategory.name}
                    </h1>
                    <p className="hidden md:block text-gray-500 text-sm font-medium">
                      {sortedProducts.length} items
                    </p>
                  </div>
                </div>

                {/* Sort Dropdown - Compact & Right Aligned */}
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-emerald-500 transition-all text-sm group whitespace-nowrap"
                  >
                    <ArrowUpDown size={14} className="text-emerald-500" />
                    <span className="font-medium text-gray-700 group-hover:text-emerald-600 truncate max-w-[100px] hidden sm:block">
                      {sortOptions.find(opt => opt.id === sortBy)?.label}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsSortOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        {sortOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSortBy(option.id);
                              setIsSortOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-emerald-50 transition-colors ${sortBy === option.id ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-600'
                              }`}
                          >
                            <option.icon size={14} className={sortBy === option.id ? 'text-emerald-500' : 'text-gray-400'} />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full"></div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                🔍
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Category Not Found
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                The category "{category}" doesn't exist in our collection.
              </p>
            </div>
          )}
        </div>

        {/* Slot Availability Message */}
        {searchCategory && selectedSlot && selectedSlot.date && selectedSlot.timeSlot && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 font-medium">
              Showing availability for <span className="font-bold">{selectedSlot.timeSlot}</span> delivery on <span className="font-bold">{new Date(selectedSlot.date).toLocaleDateString()}</span>
            </p>
            <p className="text-green-600 text-sm mt-1">
              Products marked as unavailable cannot be ordered for this slot.
            </p>
          </div>
        )}

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {sortedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : searchCategory ? (
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