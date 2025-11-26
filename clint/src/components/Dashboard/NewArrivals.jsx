import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ProductCard from '../Products/ProductCard';

const NewArrivals = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const { products: contextProducts } = useAppContext();
  const navigate = useNavigate();
  
  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const shuffleIntervalRef = useRef(null);

  // Get 16 products (8 for each row)
  const fetchNewArrivals = () => {
    try {
      if (contextProducts && contextProducts.length > 0) {
        const recentProducts = contextProducts.slice(0, 16);
        setAllProducts(recentProducts);
        setDisplayProducts({
          row1: recentProducts.slice(0, 8),
          row2: recentProducts.slice(8, 16)
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Smooth shuffle products for both rows
  const shuffleProducts = useCallback(() => {
    if (allProducts.length === 0) return;
    
    setIsShuffling(true);
    
    // Smooth fade out
    setTimeout(() => {
      const shuffled = [...allProducts].sort(() => Math.random() - 0.5);
      const row1Products = shuffled.slice(0, 8);
      const row2Products = shuffled.slice(8, 16);
      
      setDisplayProducts({
        row1: row1Products,
        row2: row2Products
      });
      
      // Smooth fade in
      setTimeout(() => {
        setIsShuffling(false);
      }, 300);
    }, 300);
  }, [allProducts]);

  useEffect(() => {
    fetchNewArrivals();
  }, [contextProducts]);

  // Auto-shuffle products every 2 minutes
  useEffect(() => {
    shuffleIntervalRef.current = setInterval(() => {
      if (allProducts.length > 0) {
        shuffleProducts();
      }
    }, 2 * 60 * 1000);

    return () => {
      if (shuffleIntervalRef.current) {
        clearInterval(shuffleIntervalRef.current);
      }
    };
  }, [allProducts, shuffleProducts]);

  // Smooth horizontal auto-scroll animation
  const animateScroll = useCallback(() => {
    if (isPaused || isShuffling) {
      animationFrameRef.current = requestAnimationFrame(animateScroll);
      return;
    }

    // Top row: scroll right to left
    if (topRowRef.current) {
      const container = topRowRef.current;
      container.scrollLeft += 0.5;
      
      // Reset to start when reaching end (seamless loop)
      if (container.scrollLeft >= container.scrollWidth / 2) {
        container.scrollLeft = 0;
      }
    }
    
    // Bottom row: scroll left to right
    if (bottomRowRef.current) {
      const container = bottomRowRef.current;
      container.scrollLeft -= 0.5;
      
      // Reset to start when reaching beginning (seamless loop)
      if (container.scrollLeft <= 0) {
        container.scrollLeft = container.scrollWidth / 2;
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(animateScroll);
  }, [isPaused, isShuffling]);

  // Start horizontal scrolling animation
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animateScroll);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [animateScroll]);

  // Handle user interaction - pause scrolling for 3 seconds
  const handleUserInteraction = useCallback(() => {
    setIsPaused(true);
    
    // Clear existing timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    // Resume after 3 seconds
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  }, []);

  // Add event listeners ONLY for product row interactions
  useEffect(() => {
    const handleInteraction = () => {
      handleUserInteraction();
    };

    const topRow = topRowRef.current;
    const bottomRow = bottomRowRef.current;
    
    const addListeners = (element) => {
      if (element) {
        // Only listen to events that indicate direct interaction with product rows
        element.addEventListener('mousedown', handleInteraction);
        element.addEventListener('touchstart', handleInteraction, { passive: true });
        element.addEventListener('wheel', handleInteraction, { passive: true });
        
        // Horizontal scroll events on the product rows only
        element.addEventListener('scroll', (e) => {
          // Only pause if it's a horizontal scroll on the product rows
          if (Math.abs(e.target.scrollLeft) > 0) {
            handleInteraction();
          }
        }, { passive: true });
      }
    };
    
    const removeListeners = (element) => {
      if (element) {
        element.removeEventListener('mousedown', handleInteraction);
        element.removeEventListener('touchstart', handleInteraction);
        element.removeEventListener('wheel', handleInteraction);
        element.removeEventListener('scroll', handleInteraction);
      }
    };
    
    // Add listeners after a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (topRow) addListeners(topRow);
      if (bottomRow) addListeners(bottomRow);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      if (topRow) removeListeners(topRow);
      if (bottomRow) removeListeners(bottomRow);
    };
  }, [handleUserInteraction]);

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
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[180px] animate-pulse">
                  <div className="bg-emerald-100 h-40 rounded-lg mb-2"></div>
                  <div className="bg-emerald-100 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-emerald-100 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            {/* Line 2 */}
            <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-thin scrollbar-thumb-lime-200 scrollbar-track-transparent">
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

  if (!displayProducts.row1 || displayProducts.row1.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-gradient-to-r from-emerald-50 via-lime-50 to-white py-8">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">New Arrivals</h2>
          <p className="text-gray-600 text-sm">
            Fresh picks • Auto-shuffles every 2 minutes • Touch products to pause
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-emerald-100">
            <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-500'} ${!isPaused && !isShuffling ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm text-gray-700">
              {isShuffling ? 'Shuffling products...' : isPaused ? 'Paused - resumes in 3s' : 'Auto-scrolling'}
            </span>
          </div>
        </div>

        {/* Top Row - Scrolls right to left */}
        <div 
          ref={topRowRef}
          className="flex gap-4 mb-6 overflow-x-scroll scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-transparent hover:scrollbar-thumb-emerald-400 pb-4"
          style={{ 
            cursor: 'grab',
            scrollBehavior: 'smooth'
          }}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
        >
          {/* Original products */}
          {displayProducts.row1.map((product, index) => (
            <div 
              key={`top-original-${product._id}-${index}`}
              className={`flex-shrink-0 w-[180px] md:w-[200px] transform transition-all duration-300 ease-in-out ${
                isShuffling ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              } hover:scale-105`}
              onClick={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onTouchStart={handleUserInteraction}
            >
              <div className="bg-white rounded-lg shadow-sm border border-emerald-100 overflow-hidden hover:shadow-md transition-all duration-200">
                <ProductCard 
                  product={product}
                  showBadge={true}
                  badgeText="New"
                  badgeColor="emerald"
                />
              </div>
            </div>
          ))}
          
          {/* Duplicated products for seamless loop */}
          {displayProducts.row1.map((product, index) => (
            <div 
              key={`top-duplicate-${product._id}-${index}`}
              className={`flex-shrink-0 w-[180px] md:w-[200px] transform transition-all duration-300 ease-in-out ${
                isShuffling ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              } hover:scale-105`}
              onClick={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onTouchStart={handleUserInteraction}
            >
              <div className="bg-white rounded-lg shadow-sm border border-emerald-100 overflow-hidden hover:shadow-md transition-all duration-200">
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

        {/* Bottom Row - Scrolls left to right */}
        <div 
          ref={bottomRowRef}
          className="flex gap-4 overflow-x-scroll scrollbar-thin scrollbar-thumb-lime-300 scrollbar-track-transparent hover:scrollbar-thumb-lime-400 pb-4"
          style={{ 
            cursor: 'grab',
            scrollBehavior: 'smooth'
          }}
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          onWheel={handleUserInteraction}
        >
          {/* Original products */}
          {displayProducts.row2.map((product, index) => (
            <div 
              key={`bottom-original-${product._id}-${index}`}
              className={`flex-shrink-0 w-[180px] md:w-[200px] transform transition-all duration-300 ease-in-out ${
                isShuffling ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              } hover:scale-105`}
              onClick={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onTouchStart={handleUserInteraction}
            >
              <div className="bg-white rounded-lg shadow-sm border border-lime-100 overflow-hidden hover:shadow-md transition-all duration-200">
                <ProductCard 
                  product={product}
                  showBadge={true}
                  badgeText="Fresh"
                  badgeColor="lime"
                />
              </div>
            </div>
          ))}
          
          {/* Duplicated products for seamless loop */}
          {displayProducts.row2.map((product, index) => (
            <div 
              key={`bottom-duplicate-${product._id}-${index}`}
              className={`flex-shrink-0 w-[180px] md:w-[200px] transform transition-all duration-300 ease-in-out ${
                isShuffling ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              } hover:scale-105`}
              onClick={handleUserInteraction}
              onMouseDown={handleUserInteraction}
              onTouchStart={handleUserInteraction}
            >
              <div className="bg-white rounded-lg shadow-sm border border-lime-100 overflow-hidden hover:shadow-md transition-all duration-200">
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

        {/* CTA Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/products/all')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            View All Products
          </button>
        </div>

      </div>
    </section>
  );
};

export default NewArrivals;