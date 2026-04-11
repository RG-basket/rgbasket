import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Sparkles, Gift, ShoppingBag, Check, ChevronRight, ChevronLeft, Minimize2, Maximize2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../store/useCartStore';
import { useAppContext } from '../../context/AppContext';

/**
 * InstamartFloatingBar
 * A highly interactive, premium milestone tracker that can be minimized by the user.
 */
const InstamartFloatingBar = () => {
  const navigate = useNavigate();
  const { items, giftTier, availableOffers, calculateSubtotal, fetchOffers } = useCartStore();
  const { serviceAreas, selectedAddress } = useAppContext();
  
  const [isMinimized, setIsMinimized] = useState(false);
  
  const subtotal = calculateSubtotal();

  // Sync delivery threshold with project's Cart logic
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

  // Segmented Progress Logic: Visual accuracy for every tier
  const calculateSegmentedProgress = () => {
    if (milestones.length === 0) return 0;
    
    const segmentCount = milestones.length;
    const segmentWidth = 100 / segmentCount;

    // Find current active segment index
    let activeSegmentIndex = milestones.findIndex(ms => subtotal < ms.value);
    
    // If we've passed all milestones
    if (activeSegmentIndex === -1) return 100;

    // Previous threshold (floor for current segment)
    const prevValue = activeSegmentIndex === 0 ? 0 : milestones[activeSegmentIndex - 1].value;
    const nextValue = milestones[activeSegmentIndex].value;
    
    // Progress within THIS specific segment
    const segmentProgress = ((subtotal - prevValue) / (nextValue - prevValue)) * segmentWidth;
    
    // Total progress = progressed full segments + current segment progress
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
            height: isMinimized ? '44px' : 'auto'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`relative flex items-center shadow-[0_10px_40px_rgba(0,0,0,0.4)] border backdrop-blur-md overflow-hidden transition-all duration-500 rounded-2xl ${
            subtotal >= deliveryThreshold 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-white/40 shadow-emerald-500/20' 
              : 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-400/20'
          }`}
        >
          {/* Main Content Wrapper */}
          <div className={`flex items-center w-full h-full px-3 py-2.5 ${isMinimized ? 'gap-2' : 'gap-4'}`}>
            
            {/* LEFT: Item Total & Icon - Now Navigates to Cart */}
            <div 
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 active:scale-95 transition-transform" 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/cart');
              }}
            >
              <div className={`flex flex-col items-center justify-center p-1.5 min-w-[40px] rounded-lg border transition-colors ${subtotal >= deliveryThreshold ? 'bg-white/20 border-white/30' : 'bg-emerald-400/20 border-emerald-400/30'}`}>
                <ShoppingBag size={14} className={subtotal >= deliveryThreshold ? 'text-yellow-300 font-bold' : 'text-yellow-100'} />
                {!isMinimized && (
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="text-[6px] font-black uppercase tracking-tighter text-white leading-none mt-1 whitespace-nowrap"
                  >
                    View Cart
                  </motion.span>
                )}
              </div>
              <div className="flex flex-col items-start">
                {!isMinimized && (
                   <span className="text-[8px] font-black uppercase text-white/70 tracking-tighter leading-none">Total</span>
                )}
                <span className="text-sm font-black tracking-widest text-white leading-none">₹{Math.round(subtotal)}</span>
              </div>
            </div>

            {/* CENTER: Timeline (Hidden in Minimized Mode) */}
            <AnimatePresence mode="wait">
              {!isMinimized && (
                <motion.div 
                  key="full-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 relative h-8 flex items-center px-1"
                >
                   {/* Track Background */}
                   <div className="absolute inset-x-0 h-1 bg-emerald-900/60 rounded-full" />
                   
                   {/* Active Progress */}
                   <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="absolute left-0 h-1 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)] z-0"
                   />
                   
                   {/* Milestone Nodes */}
                   <div className="absolute inset-x-0 flex justify-between h-full pointer-events-none">
                      {milestones.map((ms, idx) => {
                        const isAchieved = subtotal >= ms.value;
                        const MilestoneIcon = ms.icon;
                        
                        // Place nodes at segment ends (e.g., 33%, 66%, 100% for 3 nodes)
                        const segmentWidth = 100 / milestones.length;
                        const pos = (idx + 1) * segmentWidth;
                        
                        return (
                          <div 
                            key={idx} 
                            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                            style={{ left: `${Math.min(pos, 100)}%` }}
                          >

                            <motion.div 
                              animate={{ 
                                scale: isAchieved ? 1.2 : 1,
                                backgroundColor: isAchieved ? '#ffffff' : '#064e3b'
                              }}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 transition-colors z-10 ${
                                isAchieved ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'border-emerald-800'
                              }`}
                            >
                               <MilestoneIcon size={10} className={`${isAchieved ? 'text-emerald-700 font-bold animate-pulse' : 'text-emerald-400 opacity-40'}`} />
                            </motion.div>
                            <span className={`absolute -bottom-4 -translate-x-1/2 text-[7px] font-black uppercase tracking-tighter whitespace-nowrap ${isAchieved ? 'text-white' : 'text-emerald-900/40'}`}>
                               {ms.label}
                            </span>
                          </div>
                        )
                      })}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MINIMIZED VIEW: Next Step Preview */}
            <AnimatePresence>
               {isMinimized && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex items-center gap-2 border-l border-white/10 pl-2"
                 >
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                       <Truck size={12} className={subtotal >= deliveryThreshold ? 'text-white' : 'text-white/40'} />
                       <Gift size={12} className={giftTier > 0 ? 'text-yellow-300' : 'text-white/40'} />
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
               <button 
                 onClick={() => setIsMinimized(!isMinimized)}
                 className={`p-1 rounded-lg transition-all ${isMinimized ? 'bg-white/10 hover:bg-white/20' : 'hover:bg-white/10'}`}
               >
                  {isMinimized ? <Maximize2 size={14} className="text-white" /> : <Minimize2 size={14} className="text-white/70" />}
               </button>
            </div>


          </div>

          {/* BACKGROUND SHINE */}
          <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear", repeatDelay: 5 }}
              className="absolute top-0 w-32 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default InstamartFloatingBar;
