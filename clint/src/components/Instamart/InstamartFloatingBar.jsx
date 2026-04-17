import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Sparkles, Gift, ShoppingBag, Check, ChevronRight, ChevronLeft, Minimize2, Maximize2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/useCartStore';
import { useAppContext } from '../../context/AppContext';

/**
 * InstamartFloatingBar
 * Restored original design with icons on timeline + dynamic "Add ₹X more" text.
 * Updated to be theme-aware (Red for Non-Veg, Emerald for Veg).
 */
const InstamartFloatingBar = () => {
  const navigate = useNavigate();
  const { items, giftTier, availableOffers, calculateSubtotal, fetchOffers } = useCartStore();
  const { serviceAreas, selectedAddress, isNonVegTheme } = useAppContext();
  
  const [isMinimized, setIsMinimized] = useState(false);
  
  const subtotal = calculateSubtotal();

  // Sync delivery threshold
  const selectedArea = serviceAreas?.find(area => area.pincode === selectedAddress?.pincode && area.isActive);
  const deliveryThreshold = selectedArea ? (selectedArea.minOrderForFreeDelivery ?? 299) : 299;

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const cartItems = items.filter(item => !item.isGift);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const milestones = [
    { type: 'delivery', value: deliveryThreshold, icon: Truck, label: 'Free' },
    ...availableOffers.map(o => ({
      type: 'gift',
      value: o.minOrderValue,
      icon: Gift,
      label: 'Gift'
    }))
  ].sort((a,b) => a.value - b.value).slice(0, 3);

  // Dynamic Prompt Logic
  const nextMilestone = milestones.find(ms => subtotal < ms.value);

  // Segmented Progress Logic for visual accuracy
  const calculateSegmentedProgress = () => {
    if (milestones.length === 0) return 0;
    const segmentCount = milestones.length;
    const segmentWidth = 100 / segmentCount;
    let activeSegmentIndex = milestones.findIndex(ms => subtotal < ms.value);
    if (activeSegmentIndex === -1) return 100;
    const prevValue = activeSegmentIndex === 0 ? 0 : milestones[activeSegmentIndex - 1].value;
    const nextValue = milestones[activeSegmentIndex].value;
    const segmentProgress = ((subtotal - prevValue) / (nextValue - prevValue)) * segmentWidth;
    return (activeSegmentIndex * segmentWidth) + segmentProgress;
  };

  const progressPercent = calculateSegmentedProgress();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-md pointer-events-none">
      <div className="relative w-full flex justify-center pointer-events-auto">
        
        <motion.div
          layout
          initial={false}
          animate={{ 
            width: isMinimized ? 'auto' : '100%',
            height: isMinimized ? '44px' : '64px'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`relative flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.4)] border border-white/30 backdrop-blur-md overflow-hidden rounded-2xl ${
            isNonVegTheme 
              ? (subtotal >= deliveryThreshold ? 'bg-gradient-to-r from-red-600 to-red-800 shadow-red-500/20' : 'bg-gradient-to-r from-red-500 to-red-600 border-red-400/20')
              : (subtotal >= deliveryThreshold ? 'bg-gradient-to-r from-emerald-600 to-green-700 shadow-emerald-500/20' : 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-400/20')
          }`}
        >
          {/* Main Content Wrapper */}
          <div className={`flex items-center w-full h-full px-3 ${isMinimized ? 'gap-2' : 'gap-4'}`}>
            
            {/* LEFT: Item Total & View Cart Link */}
            <div 
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer active:scale-95 transition-transform" 
              onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
            >
              <div className={`flex flex-col items-center justify-center p-1.5 min-w-[40px] rounded-xl border transition-colors ${
                subtotal >= deliveryThreshold 
                  ? 'bg-white/20 border-white/30' 
                  : (isNonVegTheme ? 'bg-red-400/20 border-red-400/30' : 'bg-emerald-400/20 border-emerald-400/30')
              }`}>
                <ShoppingBag size={14} className="text-white" />
                {!isMinimized && (
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[6px] font-black uppercase tracking-tighter text-white mt-0.5"
                  >
                    View Cart
                  </motion.span>
                )}
              </div>
              <div className="flex flex-col items-start">
                {!isMinimized && <span className="text-[7px] font-black uppercase text-white/60 tracking-widest leading-none">Total</span>}
                <span className="text-sm font-black tracking-widest text-white leading-none">₹{Math.round(subtotal)}</span>
              </div>
            </div>

            {/* CENTER: Timeline + Dynamic Text */}
            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.div 
                  key="center-area"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col items-center justify-center min-w-0 h-full py-1"
                >
                   {/* Dynamic Prompt (Top) */}
                   <div className="h-4 flex items-center mb-1">
                      {nextMilestone ? (
                        <motion.span 
                          animate={{ opacity: [0.7, 1, 0.7] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-[8px] font-black text-white uppercase tracking-tighter whitespace-nowrap"
                        >
                          Add <span className="text-yellow-300">₹{Math.ceil(nextMilestone.value - subtotal)}</span> for {nextMilestone.type === 'delivery' ? 'Free Delivery' : 'Free Gift'}
                        </motion.span>
                      ) : (
                        <span className="text-[8px] font-black text-yellow-300 uppercase tracking-widest flex items-center gap-1">
                          <Check size={8} /> All Perks Unlocked
                        </span>
                      )}
                   </div>

                   {/* Original Timeline Design (Bottom) */}
                   <div className="relative w-full h-6 flex items-center px-1">
                      <div className={`absolute inset-x-0 h-1 rounded-full ${isNonVegTheme ? 'bg-red-900/40' : 'bg-emerald-900/40'}`} />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="absolute left-0 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] z-0"
                      />
                      <div className="absolute inset-x-0 flex justify-between h-full pointer-events-none">
                        {milestones.map((ms, idx) => {
                          const isAchieved = subtotal >= ms.value;
                          const MilestoneIcon = ms.icon;
                          const segmentWidth = 100 / milestones.length;
                          const pos = (idx + 1) * segmentWidth;
                          
                          return (
                            <div key={idx} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${Math.min(pos, 100)}%` }}>
                              <motion.div 
                                animate={{ 
                                  scale: isAchieved ? 1.1 : 1, 
                                  backgroundColor: isAchieved ? '#ffffff' : (isNonVegTheme ? '#7f1d1d' : '#064e3b') 
                                }}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center -translate-x-1/2 transition-colors z-10 ${
                                  isAchieved 
                                    ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.6)]' 
                                    : (isNonVegTheme ? 'border-red-900' : 'border-emerald-800')
                                }`}
                              >
                                 <MilestoneIcon size={8} className={`${isAchieved ? (isNonVegTheme ? 'text-red-700' : 'text-emerald-700') : (isNonVegTheme ? 'text-red-300 opacity-40' : 'text-emerald-400 opacity-40')} font-bold`} />
                              </motion.div>
                              <span className={`absolute -bottom-3.5 -translate-x-1/2 text-[6px] font-black uppercase tracking-tighter whitespace-nowrap ${
                                isAchieved 
                                  ? 'text-white' 
                                  : (isNonVegTheme ? 'text-red-900/40' : 'text-emerald-900/40')
                              }`}>
                                 {ms.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RIGHT: Minimize Button */}
            <div className="flex-shrink-0">
               <button 
                 onClick={() => setIsMinimized(!isMinimized)}
                 className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
               >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
               </button>
            </div>

          </div>

          {/* Shine Effect */}
          <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear", repeatDelay: 3 }}
              className="absolute top-0 w-32 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default InstamartFloatingBar;
