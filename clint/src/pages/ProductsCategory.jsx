import React from 'react';
import { useappcontext } from '../context/appcontext';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/Products/ProductCard';
import { categories } from '../assets/assets'; // 👈 Assuming you have a categories array

const ProductsCategory = () => {
  const { products } = useappcontext();
  const { category } = useParams();

  // Find category metadata (like display name)
  const searchCategory = categories.find(
    (item) => item.path.toLowerCase() === category.toLowerCase()
  );

  // Filter products by category
  const filteredProducts = products.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase()
  );

  return (
    <div className="mt-16 px-4 md:px-8 lg:px-16 pb-20">
      {searchCategory && (
        <div className="flex flex-col items-end w-max mb-6">
          <p className="text-2xl font-medium capitalize">
            {/* Text removed but structure kept */}
          </p>
          <div className="w-16 h-0.5 bg-primary rounded-full"></div>
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid 
  grid-cols-2        /* default: mobile */
  sm:grid-cols-2     /* ≥640px */
  md:grid-cols-4     /* ≥768px */
  lg:grid-cols-5     /* ≥1024px */
  xl:grid-cols-7     /* ≥1280px */
  gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No products found in this category.</p>
      )}
    </div>
  );
};

export default ProductsCategory;
