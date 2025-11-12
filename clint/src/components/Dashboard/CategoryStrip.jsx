import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryStrip = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch categories from product data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        const data = await res.json();
        const products = Array.isArray(data) ? data : data.products || data.data || [];

        const categorySet = new Set();
        products.forEach(p => {
          if (p.category && typeof p.category === 'string') {
            categorySet.add(p.category.trim());
          }
        });

        const dynamicCategories = Array.from(categorySet).map((cat, i) => ({
          name: cat,
          slug: cat.toLowerCase().replace(/\s+/g, '-'),
        }));

        setCategories(dynamicCategories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Optional: icon mapping
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      Fruits: '🍎',
      Vegetables: '🥦',
      Dairy: '🥛',
      Bakery: '🍞',
      Beverages: '🥤',
      Snacks: '🍿',
      Meat: '🥩',
      Seafood: '🐟',
      Grains: '🌾',
      Frozen: '🧊',
      Household: '🏠',
      Spices: '🌶️',
      Seeds: '🌱',
      Instant: '⚡',
      Others: '📦',
    };
    return iconMap[categoryName] ;
  };

  return (
    <div className="w-full border-b border-gray-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-white flex justify-center">
      <div
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory whitespace-nowrap px-4 md:px-6 py-3 space-x-4 md:space-x-6"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          onClick={() => {
            setActiveCategory('all');
            navigate(`/products/all`);
            scrollTo(0, 0);
          }}
          className={`relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium text-gray-700 transition-all duration-300 snap-start ${
            activeCategory === 'all' ? 'scale-[1.15] font-semibold text-emerald-800' : 'scale-100'
          }`}
        >
          <span className="text-sm md:text-base">🛒</span>
          <span>All</span>
          <span
            className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[6px] w-12 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-transform duration-300 origin-center ${
              activeCategory === 'all' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
            }`}
          ></span>
        </button>

        {categories.map((item, index) => {
          const isActive = activeCategory === item.slug;
          return (
            <button
              key={item.slug}
              onClick={() => {
                setActiveCategory(item.slug);
                navigate(`/products/${item.slug}`);
                scrollTo(0, 0);
              }}
              className={`relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium text-gray-700 transition-all duration-300 snap-start ${
                isActive ? 'scale-[1.15] font-semibold text-emerald-800' : 'scale-100'
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="text-sm md:text-base">{getCategoryIcon(item.name)}</span>
              <span>{item.name}</span>
              <span
                className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 h-[6px] w-12 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 transition-transform duration-300 origin-center ${
                  isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                }`}
              ></span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryStrip;