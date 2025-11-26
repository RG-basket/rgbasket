import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UnavailableItemsModal = ({ isOpen, onClose, onRemove, items }) => {
  if (!isOpen) return null;

  // Convert items object to array if needed, or use as is if it's already an array
  // The cart logic passes an object where keys are cartKeys and values are reasons/items
  // We need to ensure we have the item details to display
  const itemsList = Array.isArray(items) ? items : Object.values(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Items Unavailable</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  The following items are not available in the selected delivery slot.
                </p>
              </div>

              {/* Items List */}
              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
                {itemsList.map((item, index) => (
                  <div key={item.cartKey || index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {/* Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <img
                        src={item.image || item.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-500">{item.weight}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">
                          Qty: {item.quantity}
                        </span>
                        {item.reason && (
                           <span className="text-xs text-orange-600 truncate">
                             {item.reason}
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-200"
                >
                  Cancel / Keep All
                </button>
                <button
                  onClick={onRemove}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm shadow-red-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Items
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UnavailableItemsModal;
