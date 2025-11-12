import React, { useEffect, useState } from 'react';
import { useappcontext } from '../context/appcontext';
import ProductCard from '../components/Products/ProductCard';

const Products = () => {
  const { products, searchQuery } = useappcontext();
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setFilteredProducts(
        products.filter((product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  return (
    <div className="mt-8 px-4 md:px-2 lg:px-4 pb-20 max-w-screen-xl mx-auto">
      <div className="flex flex-col items-end w-max mb-6">
        <p className="text-2xl font-medium uppercase">All Products</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredProducts
            .filter((product) => product.inStock)
            .map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No products found.</p>
      )}
    </div>
  );
};

export default Products;