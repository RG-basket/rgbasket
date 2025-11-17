import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useappcontext } from '../../context/appcontext';
import ProductCard from '../Products/ProductCard';

const NewArrivals = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [currentSet, setCurrentSet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { products: contextProducts } = useappcontext();
  const navigate = useNavigate();
  const scrollIntervalRef = useRef(null);

  // Show 8 products per set (4 in each of 2 lines)
  const productsPerSet = 8;
  const totalSets = Math.ceil(allProducts.length / productsPerSet);
  
  const currentProducts = allProducts.slice(
    currentSet * productsPerSet,
    (currentSet + 1) * productsPerSet
  );

  // Split into two lines of 4 products each
  const line1Products = currentProducts.slice(0, 4);
  const line2Products = currentProducts.slice(4, 8);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        
        // Get 16 products for 2 sets of 8 (4x2 lines)
        if (contextProducts && contextProducts.length > 0) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const recentProducts = contextProducts
            .filter(product => product.createdAt ? new Date(product.createdAt) >= oneWeekAgo : true)
            .slice(0, 16);
          
          const displayProducts = recentProducts.length > 0 
            ? recentProducts 
            : contextProducts.slice(0, 16);
            
          setAllProducts(displayProducts);
        }
        
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contextProducts?.length > 0) {
      fetchNewArrivals();
    }
  }, [contextProducts]);

  // Slow auto-scroll effect
  useEffect(() => {
    if (totalSets <= 1) return;

    const scrollContainers = document.querySelectorAll('.scroll-container');
    
    const startScrolling = () => {
      scrollIntervalRef.current = setInterval(() => {
        scrollContainers.forEach((container, index) => {
          // Very slow scroll speed
          const scrollSpeed = 0.3; // pixels per interval
          
          if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 10) {
            container.scrollLeft = 0;
          } else {
            container.scrollLeft += scrollSpeed;
          }
        });
      }, 30); // Smooth interval
    };

    const stopScrolling = () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };

    // Start after delay
    const timer = setTimeout(startScrolling, 1000);

    // Add hover events
    scrollContainers.forEach(container => {
      container.addEventListener('mouseenter', stopScrolling);
      container.addEventListener('mouseleave', startScrolling);
      container.addEventListener('touchstart', stopScrolling);
      container.addEventListener('touchend', () => setTimeout(startScrolling, 2000));
    });

    return () => {
      clearTimeout(timer);
      stopScrolling();
      scrollContainers.forEach(container => {
        if (container) {
          container.removeEventListener('mouseenter', stopScrolling);
          container.removeEventListener('mouseleave', startScrolling);
          container.removeEventListener('touchstart', stopScrolling);
          container.removeEventListener('touchend', startScrolling);
        }
      });
    };
  }, [allProducts, loading]);

  // Smooth set transition with crossfade
  const transitionToSet = (newSet) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Smooth fade out
    setTimeout(() => {
      setCurrentSet(newSet);
      // Smooth fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300);
  };

  // Auto-rotate between sets every 8 seconds with smooth transition
  useEffect(() => {
    if (totalSets <= 1) return;

    const interval = setInterval(() => {
      transitionToSet((currentSet + 1) % totalSets);
    }, 8000);

    return () => clearInterval(interval);
  }, [totalSets, currentSet]);

  const nextSet = () => {
    transitionToSet((currentSet + 1) % totalSets);
  };

  const prevSet = () => {
    transitionToSet((currentSet - 1 + totalSets) % totalSets);
  };

  if (loading) {
    return (
      <section className="w-full bg-gradient-to-r from-emerald-50 via-lime-50 to-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-7 bg-emerald-200 rounded w-48 mx-auto mb-3 animate-pulse"></div>
          </div>
          
          {/* Two horizontal lines skeleton */}
          <div className="space-y-4">
            {/* Line 1 */}
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[180px] animate-pulse">
                  <div className="bg-emerald-100 h-40 rounded-lg mb-2"></div>
                  <div className="bg-emerald-100 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-emerald-100 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            {/* Line 2 */}
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[180px] animate-pulse">
                  <div className="bg-lime-100 h-40 rounded-lg mb-2"></div>
                  <div className="bg-lime-100 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-lime-100 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (allProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gradient-to-r from-emerald-50 via-lime-50 to-white py-8">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">New Arrivals</h2>
          <p className="text-gray-600 text-sm">
            Fresh picks • Smooth transitions every 8 seconds
          </p>
        </div>

        {/* Two Horizontal Lines with Smooth Transitions */}
        <div className="space-y-4 mb-6">
          {/* Line 1 */}
          <div className={`scroll-container flex overflow-x-auto gap-3 pb-4 scrollbar-hide transition-all duration-1000 ease-out ${
            isTransitioning ? 'opacity-70 scale-98' : 'opacity-100 scale-100'
          }`}>
            {line1Products.map((product) => (
              <div key={product._id} className="flex-shrink-0 w-[180px] transform transition-all duration-500 hover:scale-105">
                <div className={`transition-all duration-500 ${
                  isTransitioning ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'
                }`}>
                  <ProductCard 
                    product={product}
                    showBadge={true}
                    badgeText="New"
                    badgeColor="emerald"
                  />
                </div>
              </div>
            ))}
            
            {/* Duplicate for seamless loop */}
            {line1Products.map((product) => (
              <div key={`${product._id}-dup`} className="flex-shrink-0 w-[180px] transform transition-all duration-500 hover:scale-105">
                <div className={`transition-all duration-500 ${
                  isTransitioning ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'
                }`}>
                  <ProductCard 
                    product={product}
                    showBadge={true}
                    badgeText="New"
                    badgeColor="emerald"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Line 2 */}
          <div className={`scroll-container flex overflow-x-auto gap-3 pb-4 scrollbar-hide transition-all duration-1000 ease-out ${
            isTransitioning ? 'opacity-70 scale-98' : 'opacity-100 scale-100'
          }`}>
            {line2Products.map((product) => (
              <div key={product._id} className="flex-shrink-0 w-[180px] transform transition-all duration-500 hover:scale-105">
                <div className={`transition-all duration-500 ${
                  isTransitioning ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'
                }`}>
                  <ProductCard 
                    product={product}
                    showBadge={true}
                    badgeText="Fresh"
                    badgeColor="lime"
                  />
                </div>
              </div>
            ))}
            
            {/* Duplicate for seamless loop */}
            {line2Products.map((product) => (
              <div key={`${product._id}-dup`} className="flex-shrink-0 w-[180px] transform transition-all duration-500 hover:scale-105">
                <div className={`transition-all duration-500 ${
                  isTransitioning ? 'opacity-50 blur-[1px]' : 'opacity-100 blur-0'
                }`}>
                  <ProductCard 
                    product={product}
                    showBadge={true}
                    badgeText="Fresh"
                    badgeColor="lime"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Controls - Only show if multiple sets */}
        {totalSets > 1 && (
          <>
            <div className="flex justify-center items-center gap-6 mb-4">
              {/* Previous Button */}
              <button
                onClick={prevSet}
                disabled={isTransitioning}
                className={`w-8 h-8 bg-white border rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                  isTransitioning 
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
                aria-label="Previous set"
              >
                <span className="font-bold">‹</span>
              </button>

              {/* Dot Indicators */}
              <div className="flex gap-2">
                {Array.from({ length: totalSets }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => !isTransitioning && transitionToSet(index)}
                    disabled={isTransitioning}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentSet === index 
                        ? 'bg-emerald-500' 
                        : isTransitioning
                        ? 'bg-gray-300'
                        : 'bg-emerald-200 hover:bg-emerald-300'
                    }`}
                    aria-label={`Go to set ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={nextSet}
                disabled={isTransitioning}
                className={`w-8 h-8 bg-white border rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                  isTransitioning 
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
                aria-label="Next set"
              >
                <span className="font-bold">›</span>
              </button>
            </div>

            {/* Set Indicator */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Set {currentSet + 1} of {totalSets} • {isTransitioning ? 'Transitioning...' : 'Hover to pause scroll'}
              </p>
            </div>
          </>
        )}

        {/* CTA Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/products/all')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
          >
            View All Products
          </button>
        </div>

      </div>
    </section>
  );
};

export default NewArrivals;