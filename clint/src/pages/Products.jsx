import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCard from '../components/Products/ProductCard';

const Products = () => {
  const { products, searchQuery, selectedSlot } = useAppContext();

  // Simple filtering like ProductsCategory - no async operations
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.length > 0) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pt-10 px-4 md:px-8 lg:px-16 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="space-y-4">
            <div className="flex flex-col items-start w-max">
              <h1 className="text-4xl font-bold text-gray-900">
                All Products
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-2"></div>
            </div>
            <p className="text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        {/* Slot Availability Message - Just information, no filtering */}
        {selectedSlot && selectedSlot.date && selectedSlot.timeSlot && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 font-medium">
              Selected delivery slot: <span className="font-bold">{selectedSlot.timeSlot}</span> on <span className="font-bold">{new Date(selectedSlot.date).toLocaleDateString()}</span>
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Availability will be checked when you proceed to checkout.
            </p>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              // Remove availability props to prevent re-renders
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
              🔍
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No Products Found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {searchQuery
                ? `No products found matching "${searchQuery}". Try adjusting your search terms.`
                : 'No products available at the moment. Please check back later.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;