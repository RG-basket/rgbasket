import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Clock, ShieldCheck, PackageCheck, Zap, Minimize2, Calendar } from 'lucide-react';
import useCartStore from '../../store/useCartStore';
import toast from 'react-hot-toast';

/**
 * InstamartLiveOrderCard
 * Perfectly fits Date, Cleaned Slot Name, and Clock Time range.
 */
const InstamartLiveOrderCard = () => {
  const { activeOrder, markAsDelivered } = useCartStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!activeOrder) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  /**
   * getSlotInfo: Returns { name, time }
   * Strips "First Half", "Second Half" to save space.
   */
  const getSlotInfo = (slot) => {
    if (!slot || slot === 'Standard Delivery') return { name: 'Standard', time: 'Delivery Window' };
    
    let rawName = '';
    let rawTime = '';

    const match = slot.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      rawName = match[1];
      rawTime = match[2];
    } else {
      const fallbacks = {
        'morning': '7:00 AM - 10:00 AM',
        'morning - first half': '7:00 AM - 8:30 AM',
        'morning - second half': '8:30 AM - 10:00 AM',
        'noon': '1:00 PM - 4:00 PM',
        'afternoon': '1:00 PM - 4:00 PM',
        'evening': '4:00 PM - 7:00 PM',
        'evening - first half': '4:00 PM - 5:30 PM',
        'night': '7:00 PM - 10:00 PM',
        'night - second half': '8:30 PM - 10:00 PM'
      };
      const clean = slot.toLowerCase().trim();
      rawName = slot;
      rawTime = fallbacks[clean] || (slot.includes(':') ? slot : 'Scheduled Window');
    }

    const cleanName = rawName.replace(/\s*-\s*(First|Second)\s*Half/gi, '').trim();
    return { name: cleanName, time: rawTime };
  };

  const isDeliveryActive = activeOrder.status === 'shipped' || activeOrder.status === 'out for delivery';
  const slotInfo = getSlotInfo(activeOrder.timeSlot);

  const statusConfig = {
    'pending': { bg: 'from-blue-600 to-indigo-700', icon: <Clock size={16} className="text-white animate-pulse" />, label: 'Placed' },
    'confirmed': { bg: 'from-indigo-600 to-violet-700', icon: <ShieldCheck size={16} className="text-white" />, label: 'Confirmed' },
    'processing': { bg: 'from-violet-600 to-purple-700', icon: <Zap size={16} className="text-white animate-spin-slow" />, label: 'Preparing' },
    'shipped': { bg: 'from-emerald-600 to-green-700', icon: <Truck size={18} className="text-white animate-bounce-subtle" />, label: 'On Way' },
    'out for delivery': { bg: 'from-emerald-600 to-green-700', icon: <Truck size={18} className="text-white animate-bounce-subtle" />, label: 'Arriving' }
  };

  const config = statusConfig[activeOrder.status] || statusConfig['pending'];

  const handleConfirm = async () => {
    setIsUpdating(true);
    const success = await markAsDelivered(activeOrder.id);
    if (success) {
      toast.success("Order confirmed as delivered!");
      setShowConfirmModal(false);
    } else {
      toast.error("Failed to update order. Please try again.");
    }
    setIsUpdating(false);
  };

  return (
    <>
      <div className={`fixed bottom-20 z-[70] transition-all duration-500 pointer-events-none ${isMinimized ? 'left-4' : 'left-2 right-2 md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-full md:max-w-lg'}`}>
        <div className="relative w-full flex justify-start pointer-events-auto">
          <motion.div
            layout
            initial={false}
            animate={{ 
              width: isMinimized ? '48px' : '100%',
              height: isMinimized ? '48px' : (isDeliveryActive ? '72px' : '64px'),
              borderRadius: isMinimized ? '999px' : '20px'
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className={`relative flex items-center shadow-[0_15px_50px_rgba(0,0,0,0.3)] border border-white/20 backdrop-blur-xl overflow-hidden bg-gradient-to-r ${config.bg} ${isMinimized ? 'justify-center' : 'px-3'}`}
          >
            <AnimatePresence mode="wait">
              {isMinimized ? (
                <motion.div key="minimized" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setIsMinimized(false)} className="cursor-pointer">
                  {config.icon}
                </motion.div>
              ) : (
                <motion.div key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center w-full gap-2">
                  
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={() => setIsMinimized(true)}>
                    <div className={`flex-shrink-0 flex items-center justify-center rounded-xl bg-white/20 ${isDeliveryActive ? 'w-10 h-10' : 'w-9 h-9'}`}>
                      {config.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-white leading-none uppercase">{config.label}</span>
                      <span className="text-[8px] font-bold text-white/70 mt-1 uppercase tracking-tighter">₹{activeOrder.total}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center border-l border-r border-white/10 px-1 overflow-hidden min-w-0">
                    <div className="flex items-center gap-1 mb-0.5 whitespace-nowrap">
                        <Calendar size={8} className="text-white/60" />
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                          {formatDate(activeOrder.deliveryDate || activeOrder.timestamp)} • {slotInfo.name}
                        </span>
                    </div>
                    <span className="text-[10px] font-black text-white leading-none tracking-tight text-center truncate w-full">
                        {slotInfo.time}
                    </span>
                    <span className="text-[6px] font-black text-white/40 uppercase mt-0.5 tracking-widest">Delivery Window</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isDeliveryActive ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowConfirmModal(true); }}
                        className="flex items-center gap-1 px-3 py-2 bg-white text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-tighter transition-all active:scale-95 shadow-lg"
                      >
                          <PackageCheck size={14} className="text-green-600" />
                          Confirm
                      </button>
                    ) : (
                      <span className="text-[7px] font-black text-white/30 uppercase mr-1">#{activeOrder.id.slice(-5).toUpperCase()}</span>
                    )}
                    <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg bg-white/10 text-white transition-all">
                        <Minimize2 size={14} />
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 4 }}
                className="absolute top-0 w-32 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
            />
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-gray-100"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Confirm Delivery</h3>
              <p className="text-gray-500 text-sm mb-6">Have you received your order? This will mark the order as delivered from your end.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Not Yet
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Received'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        .animate-bounce-subtle { animation: bounce-subtle 1.2s infinite ease-in-out; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}} />
    </>
  );
};

export default InstamartLiveOrderCard;
