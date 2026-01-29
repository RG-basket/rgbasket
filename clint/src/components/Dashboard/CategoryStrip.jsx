import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CategoryStrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // nothing clicked initially

  // Fetch categories with caching
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem('categories_cache');
        if (cached) {
          const parsedCache = JSON.parse(cached);
          const now = Date.now();
          // Cache valid for 1 hour
          if (parsedCache.timestamp && (now - parsedCache.timestamp) < 3600000) {
            console.log('✅ Using cached categories');
            setCategories(parsedCache.data);
            return;
          }
        }

        // Fetch fresh data
        console.log('🔄 Fetching fresh categories');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`);
        const data = await res.json();

        if (data.success) {
          const formatted = data.categories.map(cat => ({
            name: cat.name,
            emoji: cat.emoji,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-')
          }));
          setCategories(formatted);

          // Store in cache
          localStorage.setItem('categories_cache', JSON.stringify({
            data: formatted,
            timestamp: Date.now()
          }));
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Sync with URL
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const currentSlug = pathParts[pathParts.length - 1];
    if (currentSlug) {
      setActiveCategory(currentSlug);
    } else {
      setActiveCategory(null); // stay neutral if no slug
    }
  }, [location]);

  return (
    <div className="w-full border-b border-gray-200 bg-white/95 flex justify-center sticky top-[102px] md:top-[64px] z-30 backdrop-blur-md shadow-sm transform-gpu" style={{ backfaceVisibility: 'hidden' }}>
      <div
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory whitespace-nowrap px-4 md:px-6 py-3 space-x-4 md:space-x-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* All button */}
        <button
          onClick={() => {
            navigate(`/products/all`);
            scrollTo(0, 0);
          }}
          className={`relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium text-gray-700 transition-all duration-300 snap-start ${activeCategory === 'all' ? 'scale-[1.15] font-semibold text-emerald-800' : 'scale-100'
            }`}
        >
          <span className="text-sm md:text-base">🛒</span>
          <span>All</span>
          {activeCategory === 'all' && (
            <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[6px] w-12 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-transform duration-300 origin-center"></span>
          )}
        </button>

        {/* Dynamic categories */}
        {categories.map((item, index) => {
          const isActive = activeCategory === item.slug;
          return (
            <button
              key={item.slug}
              onClick={() => {
                navigate(`/products/${item.slug}`);
                scrollTo(0, 0);
              }}
              className={`relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium text-gray-700 transition-all duration-300 snap-start ${isActive ? 'scale-[1.15] font-semibold text-emerald-800' : 'scale-100'
                }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="text-sm md:text-base">{item.emoji}</span>
              <span>{item.name}</span>
              {isActive && (
                <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[6px] w-12 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-transform duration-300 origin-center"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryStrip;