import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const CategoryStrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isNonVegTheme } = useAppContext();
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
    <div className="w-full border-b border-gray-100/50 bg-white/70 flex justify-center sticky top-[102px] md:top-[64px] z-30 backdrop-blur-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transform-gpu" style={{ backfaceVisibility: 'hidden' }}>
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
          className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all duration-500 snap-start 
            ${activeCategory === 'all' 
              ? `${isNonVegTheme ? 'text-red-700 bg-red-50/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'text-emerald-800 bg-emerald-50/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]'} scale-110` 
              : 'text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-50/50'
            }`}
        >
          <span className="text-sm md:text-base">🛒</span>
          <span>All</span>
          {activeCategory === 'all' && (
            <span className={`absolute bottom-[-1px] left-[20%] right-[20%] h-[2px] rounded-full bg-gradient-to-r ${isNonVegTheme ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-lime-500'} animate-in fade-in zoom-in duration-500`}></span>
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
              className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all duration-500 snap-start 
                ${isActive 
                  ? `${isNonVegTheme ? 'text-red-700 bg-red-50/80 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'text-emerald-800 bg-emerald-50/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]'} scale-110` 
                  : 'text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-50/50'
                }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="text-sm md:text-base">{item.emoji}</span>
              <span>{item.name}</span>
              {isActive && (
                <span className={`absolute bottom-[-1px] left-[20%] right-[20%] h-[2px] rounded-full bg-gradient-to-r ${isNonVegTheme ? 'from-red-500 to-orange-500' : 'from-emerald-500 to-lime-500'} animate-in fade-in zoom-in duration-500`}></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryStrip;