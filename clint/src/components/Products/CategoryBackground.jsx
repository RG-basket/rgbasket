import React, { useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

const categoryIconMap = {
  fruits: ['Apple', 'Banana', 'Grape', 'Strawberry', 'Citrus', 'Cherry'],
  vegetables: ['Carrot', 'LeafyGreen', 'Sprout', 'Corn', 'Salad'],
  veg: ['Carrot', 'LeafyGreen', 'Sprout', 'Corn', 'Salad'],
  nonveg: ['Drumstick', 'Beef', 'Fish', 'Shrimp'],
  meat: ['Drumstick', 'Beef', 'CookingPot'],
  poultry: ['Drumstick', 'Chicken'],
  mutton: ['Beef', 'Drumstick'],
  fish: ['Fish', 'Shrimp', 'Shell'],
  seafood: ['Fish', 'Shrimp', 'Shell'],
  daily: ['Milk', 'Cheese', 'Egg'],
  dairy: ['Milk', 'Cheese', 'Egg'],
  bakery: ['Wheat', 'Cake', 'Cookie'],
  beverages: ['Coffee', 'Cup', 'GlassWater'],
  snacks: ['Cookie', 'Pizza', 'Sandwich'],
  cleaning: ['Brush', 'Eraser', 'SprayCan'],
  beauty: ['Sparkles', 'Flower', 'Gem'],
};

const CategoryBackground = ({ category = '' }) => {
  const { isNonVegTheme } = useAppContext();
  const slug = category?.toLowerCase() || '';
  
  const matchedKeyword = useMemo(() => 
    Object.keys(categoryIconMap).find(kw => slug.includes(kw)), 
    [slug]
  );
  
  const iconNames = matchedKeyword ? categoryIconMap[matchedKeyword] : ['Package', 'Store', 'ShoppingBag'];

  // Determine theme color for icons
  const iconColor = isNonVegTheme ? '#dc2626' : '#10b981'; // red-600 or emerald-500

  // Create a grid-based set of background icons to prevent overlapping
  const backgroundIcons = useMemo(() => {
    const icons = [];
    const rows = 4;
    const cols = 3;
    const totalIcons = rows * cols; // 12
    
    for (let i = 0; i < totalIcons; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Base position for each grid cell
        const baseTop = (row / rows) * 100;
        const baseLeft = (col / cols) * 100;
        
        // Add deterministic jitter within the cell (up to 15% offset)
        const jitterTop = (i * 7 % 15);
        const jitterLeft = (i * 13 % 15);
        
        icons.push({
            id: i,
            iconName: iconNames[i % iconNames.length],
            top: `${baseTop + jitterTop + 5}%`, // +5 to avoid edges
            left: `${baseLeft + jitterLeft + 5}%`,
            initialRotate: (i * 45) % 360,
            size: 55 + (i % 3) * 20, // 55, 75, 95
            duration: 25 + (i % 4) * 5,
            delay: i * -2,
            floatRange: 20 + (i % 3) * 15,
        });
    }
    return icons;
  }, [iconNames]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={matchedKeyword || 'default'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {backgroundIcons.map((item) => {
            const IconComponent = Lucide[item.iconName] || Lucide.Package;
            return (
              <motion.div
                key={item.id}
                initial={{ scale: 0.8, opacity: 0, rotate: item.initialRotate }}
                animate={{ 
                  scale: 1, 
                  opacity: 0.08, 
                  y: [0, -item.floatRange, 0],
                  rotate: [item.initialRotate, item.initialRotate + 25, item.initialRotate],
                }}
                transition={{
                  scale: { duration: 1 },
                  opacity: { duration: 1 },
                  y: {
                    duration: item.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                  rotate: {
                    duration: item.duration * 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                }}
                style={{
                  position: 'absolute',
                  top: item.top,
                  left: item.left,
                  color: iconColor,
                }}
              >
                <IconComponent size={item.size} strokeWidth={1} />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CategoryBackground;
