import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../Products/ProductCard';

const MemoizedProductCard = React.memo(ProductCard);

const TwentyRupeeStore = () => {
  const { products: contextProducts, selectedSlot, checkProductAvailability } = useAppContext();
  const navigate = useNavigate();
  const [maxPrice, setMaxPrice] = useState(30);
  const [allStoreProducts, setAllStoreProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(16); // Initial visible
  const [displayProducts, setDisplayProducts] = useState({ row1: [], row2: [] });
  const [isShuffling, setIsShuffling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // 1. Immediately and synchronously populate candidate products under maxPrice (0ms delay)
  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      const filtered = contextProducts.filter(p => {
        const minPrice = Math.min(...(p.weights || []).map(w => w.offerPrice || w.price || 999));
        return p.active !== false && p.inStock && p.stock > 0 && minPrice <= maxPrice;
      });
      filtered.sort((a, b) => {
        const priceA = Math.min(...(a.weights || []).map(w => w.offerPrice || w.price || 999));
        const priceB = Math.min(...(b.weights || []).map(w => w.offerPrice || w.price || 999));
        return priceA - priceB;
      });
      setAllStoreProducts(filtered);
    }
  }, [contextProducts, maxPrice]);

  // 2. Asynchronously refine slot availability in background without blocking the initial render
  useEffect(() => {
    let isCancelled = false;
    if (!contextProducts || contextProducts.length === 0) return;
    if (!selectedSlot?.date || !selectedSlot?.timeSlot || !checkProductAvailability) return;

    const refineAvailability = async () => {
      try {
        const candidateProducts = contextProducts.filter(p => {
          const minPrice = Math.min(...(p.weights || []).map(w => w.offerPrice || w.price || 999));
          return p.active !== false && p.inStock && p.stock > 0 && minPrice <= maxPrice;
        });

        const checks = await Promise.all(
          candidateProducts.map(async (p) => {
            try {
              const res = await checkProductAvailability(p._id, selectedSlot.date, selectedSlot.timeSlot);
              return { product: p, isAvailable: res.available !== false };
            } catch {
              return { product: p, isAvailable: true };
            }
          })
        );

        if (isCancelled) return;

        const availableOnly = checks.filter(c => c.isAvailable).map(c => c.product);
        if (availableOnly.length > 0) {
          availableOnly.sort((a, b) => {
            const priceA = Math.min(...(a.weights || []).map(w => w.offerPrice || w.price || 999));
            const priceB = Math.min(...(b.weights || []).map(w => w.offerPrice || w.price || 999));
            return priceA - priceB;
          });
          setAllStoreProducts(availableOnly);
        }
      } catch (err) {
        console.error("Error refining store availability:", err);
      }
    };

    refineAvailability();

    return () => {
      isCancelled = true;
    };
  }, [contextProducts, maxPrice, selectedSlot?.date, selectedSlot?.timeSlot, checkProductAvailability]);

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

  // Ensure enough items exist for smooth continuous infinite scrolling without gaps
  const getLoopingProducts = (items) => {
    if (!items || items.length === 0) return [];
    let list = [...items];
    while (list.length < 8) {
      list = list.concat(items);
    }
    return list.concat(list);
  };

  useEffect(() => {
    if (bottomRowRef.current && bottomRowRef.current.scrollWidth > 0) {
      bottomRowRef.current.scrollLeft = bottomRowRef.current.scrollWidth / 2;
    }
  }, [displayProducts]);

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

  const handleStoreSwitch = (price) => {
    if (maxPrice === price) return;
    setIsShuffling(true);
    setTimeout(() => {
      setMaxPrice(price);
      setVisibleCount(16);
      setIsShuffling(false);
    }, 400);
  };

  // While contextProducts is initially loading on page refresh, render placeholder skeleton above NewArrivals
  if (!contextProducts || contextProducts.length === 0) {
    return (
      <section className="w-full bg-[#fcfdfd] py-5 md:py-7 my-1 border-y border-emerald-50/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-5 text-center">
            <div className="h-6 w-32 bg-emerald-100/70 rounded-lg animate-pulse mb-2" />
            <div className="h-2.5 w-40 bg-emerald-50 rounded animate-pulse" />
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-hidden pb-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-none w-32 sm:w-36 h-48 bg-emerald-50/40 border border-emerald-100/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Check if any products exist for the toggle tiers to decide whether to show the component
  const hasStoreProducts = contextProducts.some(p => {
    const minPrice = Math.min(...(p.weights || []).map(w => w.offerPrice || w.price || 999));
    return p.active !== false && p.inStock && p.stock > 0 && minPrice <= 30;
  });

  if (!hasStoreProducts) return null;

  return (
    <section className="w-full bg-[#fcfdfd] py-6 md:py-8 my-1 overflow-hidden border-y border-emerald-50/30 transition-all duration-300">
      <div className="container mx-auto px-4">
        {/* Compact Refined Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl md:text-3xl font-black text-[#1a3a34] tracking-tight uppercase flex items-baseline gap-1">
              <span className="text-emerald-600">₹{maxPrice}</span>
              <span className="text-[0.4em] font-black text-[#1a3a34]/40 tracking-[0.2em]">STORE</span>
            </h2>
            <div className="w-[1px] h-4 bg-emerald-100"></div>
            
            {/* Ultra-Compact Toggle with Periodic Vibration */}
            <div className="inline-flex items-center p-0.5 bg-emerald-50/50 border border-emerald-100/50 rounded-xl animate-vibrate shadow-sm">
              <button
                onClick={() => handleStoreSwitch(20)}
                className={`px-4 py-1 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wide transition-all duration-300 ${
                  maxPrice === 20 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-emerald-800/40 hover:text-emerald-700'
                }`}
              >
                20
              </button>
              <button
                onClick={() => handleStoreSwitch(30)}
                className={`px-4 py-1 rounded-lg font-bold text-[9px] md:text-[10px] uppercase tracking-wide transition-all duration-300 ${
                  maxPrice === 30 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-emerald-800/40 hover:text-emerald-700'
                }`}
              >
                30
              </button>
            </div>
          </div>

          <p className="text-emerald-600 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
            Pocket Friendly Selection
          </p>
        </div>

        <style>{`
          @keyframes vibrate {
            0%, 90%, 100% { transform: translateX(0); }
            92% { transform: translateX(-1.5px) rotate(-1deg); }
            94% { transform: translateX(1.5px) rotate(1deg); }
            96% { transform: translateX(-1.5px) rotate(-1deg); }
            98% { transform: translateX(1.5px) rotate(1deg); }
          }
          .animate-vibrate {
            animation: vibrate 6s infinite ease-in-out;
          }
        `}</style>

        {/* Top Row */}
        <div
          ref={topRowRef}
          className="flex gap-2 sm:gap-3 mb-2 sm:mb-4 overflow-x-scroll scrollbar-none pb-1 sm:pb-2"
          style={{ cursor: 'grab', scrollBehavior: 'smooth' }}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
        >
          {getLoopingProducts(displayProducts.row1).map((product, index) => (
            <MemoizedProductCard
              key={`20store-t-${product._id}-${index}`}
              product={product}
              showBadge={true}
              badgeText="Save Big"
              badgeColor="emerald"
              hideIfUnavailable={true}
              onClick={handleUserInteraction}
              className={`flex-none w-32 sm:w-36 shrink-0 transform transition-all duration-500 ${isShuffling ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} hover:scale-105`}
            />
          ))}
        </div>

        {/* Bottom Row */}
        <div
          ref={bottomRowRef}
          className="flex gap-2 sm:gap-3 overflow-x-scroll scrollbar-none pb-1 sm:pb-2"
          style={{ cursor: 'grab', scrollBehavior: 'smooth' }}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
        >
          {getLoopingProducts(displayProducts.row2).map((product, index) => (
            <MemoizedProductCard
              key={`20store-b-${product._id}-${index}`}
              product={product}
              showBadge={false}
              hideIfUnavailable={true}
              onClick={handleUserInteraction}
              className={`flex-none w-32 sm:w-36 shrink-0 transform transition-all duration-500 ${isShuffling ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'} hover:scale-105`}
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
