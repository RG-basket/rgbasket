import React, { useRef } from "react";
import ProductCard from "../Products/ProductCard.jsx";
import { useappcontext } from "../../context/appcontext.jsx";
import { Link } from "react-router-dom";


const BestSeller = () => {
  const { products } = useappcontext();
  const scrollContainerRef = useRef(null);

  const inStockProducts = products.filter((product) => product.inStock).slice(0, 8);

  return (
    <div className="mt-5 px-4 mb-0">
      <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 rounded-xl shadow-md">

        {/* Heading */}
        <div className="flex items-center justify-between px-4 pt-4">
          <p className="text-xl md:text-2xl font-semibold text-gray-800">
            Best Sellers
          </p>
          <Link
            to="/products/all"
            className="text-sm md:text-base font-medium text-gray-600 hover:text-gray-800 transition"
          >
            View All →
          </Link>
        </div>

        {/* Scrollable product row */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto px-4 py-4 hide-scrollbar scroll-smooth sm:gap-x-6"
        >
          {inStockProducts.length > 0 ? (
            inStockProducts.map((product) => (
              <div key={product._id} className="flex-none w-48">
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full min-h-32">
              <p className="text-sm text-gray-500">Loading best sellers...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestSeller;