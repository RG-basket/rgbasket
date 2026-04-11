import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Package, MapPin, Sparkles, ChevronDown } from 'lucide-react';

import useCartStore from '../../store/useCartStore';

const InstamartCartDrawer = () => {
  const { 
    items, 
    isDrawerOpen, 
    setDrawerOpen, 
    calculateSubtotal, 
    giftTier,
    placeOrder 
  } = useCartStore();

  const subtotal = calculateSubtotal();
  const deliveryThreshold = 499;
  const deliveryFee = subtotal >= deliveryThreshold ? 0 : 40;
  const progress = Math.min((subtotal / deliveryThreshold) * 100, 100);
  const remainingForFreeDelivery = Math.max(deliveryThreshold - subtotal, 0);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg bg-gray-50 rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Drag Handle */}
        <div className="flex justify-center p-3 cursor-pointer" onClick={() => setDrawerOpen(false)}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between bg-white border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Savings & Summary</h2>
              <Sparkles size={18} className="text-[#F7C910]" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                <MapPin size={10} className="text-[#F7C910]" />
                <span>Home ● 5 mins</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 group">
              {/* Product Image */}
              <div className="relative w-16 h-16 bg-white rounded-xl border border-gray-100 flex-shrink-0 flex items-center justify-center p-2 shadow-sm overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.weight}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-bold text-gray-900">₹{item.price}</span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                  )}
                  {item.isGift && (
                    <span className="text-[10px] font-bold text-[#F7C910] uppercase tracking-wider">Gift</span>
                  )}
                </div>
              </div>

              {/* Read-only Quantity Display */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Quantity</span>
                <div className="px-3 py-1 bg-gray-100 text-gray-900 text-sm font-black rounded-lg border border-gray-200 shadow-sm">
                  {item.quantity}
                </div>
              </div>

            </div>
          ))}

          {items.length === 0 && (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Package size={40} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Your cart is empty</p>
            </div>
          )}

          {/* Delivery Progress Section */}
          <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-semibold ${subtotal >= deliveryThreshold ? 'text-green-700' : 'text-gray-700'}`}>
                  {subtotal >= deliveryThreshold ? (
                    <span className="flex items-center gap-1.5">
                      Yay! You unlocked FREE Delivery 🎉
                    </span>
                  ) : (
                    `Add items worth ₹${remainingForFreeDelivery} more for FREE Delivery`
                  )}
                </span>
             </div>
             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full transition-colors duration-500 ${subtotal >= deliveryThreshold ? 'bg-[#0F4C3A]' : 'bg-[#F7C910]'}`}
                />
             </div>
          </div>

          {/* Surprise Gift Reveal */}
          <AnimatePresence>
            {giftTier > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 border-dashed flex items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-1">
                   <div className="animate-bounce">✨</div>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                   {giftTier === 1 ? '🎁' : '🍰'}
                </div>
                <div>
                  <h4 className="font-bold text-yellow-800">
                    {giftTier === 1 ? 'Basic Gift Unlocked!' : 'Premium Gift Unlocked!'}
                  </h4>
                  <p className="text-xs text-yellow-700 font-medium">Added to your cart for ₹0</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Total Payable</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-gray-900">₹{subtotal + (subtotal >= deliveryThreshold ? 0 : 40)}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Incl. Taxes</span>
                  {deliveryFee > 0 ? (
                     <span className="text-[10px] text-red-500 font-bold">+ ₹{deliveryFee} Delivery</span>
                  ) : (
                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">Free Delivery</span>
                  )}
                </div>
              </div>
            </div>
            {subtotal >= deliveryThreshold && (
               <CheckCircle size={28} className="text-[#0F4C3A]" />
            )}
          </div>

          <button
            onClick={() => placeOrder()}
            disabled={items.length === 0}
            className={`w-full py-4 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-[0.98] ${
              items.length > 0 
                ? 'bg-black text-white hover:bg-gray-900 shadow-xl' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="text-lg font-bold">Place Order</span>
            <div className="flex items-center gap-2">
               <span className="h-6 w-[1px] bg-white/20 ml-2" />
               <ChevronDown size={20} className="-rotate-90" />
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InstamartCartDrawer;
