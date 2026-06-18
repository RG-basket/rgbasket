import React, { useRef, useMemo } from "react";
import ProductCard from "../Products/ProductCard.jsx";
import { useAppContext } from "../../context/AppContext.jsx";
import { Link } from "react-router-dom";

// Memoize ProductCard to prevent unnecessary re-renders
const MemoizedProductCard = React.memo(ProductCard);

const BestSeller = () => {
  const { products } = useAppContext();
  const scrollContainerRef = useRef(null);

  // Memoize the sorted and filtered products to avoid recalculating on every render
  const inStockProducts = useMemo(() =>
    [...products]
      .filter((product) => product.active !== false && product.inStock && product.stock > 0)
      .sort((a, b) => (b.meta?.purchases || 0) - (a.meta?.purchases || 0))
      .slice(0, 10),
    [products]
  );

  return (
    <div className="my-8 px-4">
      <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 rounded-2xl shadow-sm border border-emerald-100/50">

        {/* Heading */}
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
            Best Sellers
          </p>
          <Link
            to="/products/all"
            className="text-xs md:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition-all"
          >
            View All →
          </Link>
        </div>

        {/* Scrollable product row */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto px-5 pb-6 pt-2 gap-4 sm:gap-6 hide-scrollbar scroll-smooth"
        >
          {inStockProducts.length > 0 ? (
            inStockProducts.map((product) => (
              <MemoizedProductCard 
                key={product._id} 
                product={product} 
                hideIfUnavailable={true}
                className="flex-none w-40 sm:w-48 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl bg-white"
              />
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