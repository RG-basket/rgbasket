import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/Products/ProductCard';

const API_BASE = import.meta.env.VITE_API_URL;

const ProductsCategory = () => {
  const { products, selectedSlot } = useAppContext();
  const { category } = useParams();
  const [categories, setCategories] = useState([]);
  const [searchCategory, setSearchCategory] = useState(null);
  const [loading, setLoading] = useState(true);

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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-2xl">
                  {searchCategory.emoji}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 capitalize">
                    {searchCategory.name}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {filteredProducts.length} product
                    {filteredProducts.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
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
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredProducts.map(product => (
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
    </div>
  );
};

export default ProductsCategory;