import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../Products/ProductCard';

const MemoizedProductCard = React.memo(ProductCard);

const TwentyRupeeStore = () => {
  const { products: contextProducts } = useAppContext();
  const navigate = useNavigate();
  const [allStoreProducts, setAllStoreProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(16); // Initial visible
  const [displayProducts, setDisplayProducts] = useState({ row1: [], row2: [] });
  const [isShuffling, setIsShuffling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Filter products under 20rs
  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      const filtered = contextProducts.filter(p => {
        const minPrice = Math.min(...(p.weights || []).map(w => w.offerPrice || w.price || 999));
        return p.active !== false && p.inStock && p.stock > 0 && minPrice <= 20;
      });
      // Sort by price ascending
      filtered.sort((a, b) => {
        const priceA = Math.min(...(a.weights || []).map(w => w.offerPrice || w.price || 999));
        const priceB = Math.min(...(b.weights || []).map(w => w.offerPrice || w.price || 999));
        return priceA - priceB;
      });
      setAllStoreProducts(filtered);
    }
  }, [contextProducts]);

  // Update display products based on visible count
  useEffect(() => {
    if (allStoreProducts.length > 0) {
      const visible = allStoreProducts.slice(0, visibleCount);
      const half = Math.ceil(visible.length / 2);
      setDisplayProducts({
        row1: visible.slice(0, half),
        row2: visible.slice(half)
      });
    }
  }, [allStoreProducts, visibleCount]);

  // Infinite scroll animation logic (same as NewArrivals)
  const animateScroll = useCallback(() => {
    if (isPaused || isShuffling) {
      animationFrameRef.current = requestAnimationFrame(animateScroll);
      return;
    }

    if (topRowRef.current) {
      const container = topRowRef.current;
      container.scrollLeft += 0.5;
      if (container.scrollLeft >= container.scrollWidth / 2) container.scrollLeft = 0;
    }

    if (bottomRowRef.current) {
      const container = bottomRowRef.current;
      container.scrollLeft -= 0.5;
      if (container.scrollLeft <= 0) container.scrollLeft = container.scrollWidth / 2;
    }

    animationFrameRef.current = requestAnimationFrame(animateScroll);
  }, [isPaused, isShuffling]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [animateScroll]);

  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 3000);
  }, []);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
    // Smooth transition
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 500);
  };

  if (allStoreProducts.length === 0) return null;

  return (
    <section className="w-full bg-gradient-to-r from-emerald-50/40 via-teal-50/30 to-white py-6 md:py-8 my-1 overflow-hidden border-y border-emerald-100/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative inline-block px-6">
            <h2 className="text-3xl md:text-5xl font-black text-[#1a3a34] italic tracking-tighter uppercase flex items-center gap-2">
              ₹20 <span className="text-emerald-600 not-italic">STORE</span>
            </h2>
           
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent rounded-full"></div>
          </div>
          <p className="text-gray-400 text-[9px] md:text-[11px] mt-4 font-black uppercase tracking-[0.3em] opacity-60">
            Pocket Friendly • Farm Fresh
          </p>
        </div>

        {/* Top Row */}
        <div
          ref={topRowRef}
          className="flex gap-3 mb-4 overflow-x-scroll scrollbar-none pb-2"
          style={{ cursor: 'grab', scrollBehavior: 'smooth' }}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
        >
          {displayProducts.row1.concat(displayProducts.row1).map((product, index) => (
            <MemoizedProductCard
              key={`20store-t-${product._id}-${index}`}
              product={product}
              showBadge={true}
              badgeText={`Save Big`}
              badgeColor="emerald"
              hideIfUnavailable={true}
              onClick={handleUserInteraction}
              className={`flex-shrink-0 w-[145px] sm:w-[155px] transform transition-all duration-500 ${isShuffling ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} hover:scale-105`}
            />
          ))}
        </div>

        {/* Bottom Row */}
        <div
          ref={bottomRowRef}
          className="flex gap-3 overflow-x-scroll scrollbar-none pb-2"
          style={{ cursor: 'grab', scrollBehavior: 'smooth' }}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
        >
          {displayProducts.row2.concat(displayProducts.row2).map((product, index) => (
            <MemoizedProductCard
              key={`20store-b-${product._id}-${index}`}
              product={product}
              showBadge={false}
              hideIfUnavailable={true}
              onClick={handleUserInteraction}
              className={`flex-shrink-0 w-[145px] sm:w-[155px] transform transition-all duration-500 ${isShuffling ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} hover:scale-105`}
            />
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center items-center gap-4 mt-8">
          {visibleCount < allStoreProducts.length ? (
            <button
              onClick={handleLoadMore}
              className="group relative flex items-center gap-3 bg-white border border-emerald-200 text-[#1a3a34] px-10 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-500 active:scale-95 shadow-xl shadow-emerald-100/50"
            >
              <span>Explore More Deals</span>
              <div className="flex flex-col -gap-1 group-hover:translate-y-0.5 transition-transform">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/products/all')}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-12 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:from-emerald-600 hover:to-emerald-700 hover:shadow-2xl hover:shadow-emerald-200 transition-all duration-300 active:scale-95 shadow-xl shadow-emerald-100"
            >
              Full Menu
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default TwentyRupeeStore;
