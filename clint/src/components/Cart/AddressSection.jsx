import React from 'react';
import { motion } from 'framer-motion';

const AddressSection = ({
    addresses,
    selectedAddress,
    loadingAddresses,
    setShowAddressForm
}) => {
    return (
        <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm font-medium text-green-700">DELIVERY ADDRESS</p>
                <motion.button
                    onClick={() => setShowAddressForm(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                >
                    <span className="text-sm font-bold">+</span>
                    Add / Change
                </motion.button>
            </div>

            {loadingAddresses ? (
                <div className="text-center py-3 bg-white rounded-lg sm:rounded-xl border border-green-200">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-500 text-xs sm:text-sm">Loading addresses...</p>
                </div>
            ) : addresses.length > 0 && selectedAddress ? (
                <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-green-300">
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{selectedAddress.fullName}</p>
                        {selectedAddress.isDefault && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Default</span>
                        )}
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm mb-1">{selectedAddress.street}</p>
                    <p className="text-gray-600 text-xs sm:text-sm mb-1">{selectedAddress.locality}, {selectedAddress.city}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">📞 {selectedAddress.phoneNumber}</p>
                    {selectedAddress.alternatePhone && (
                        <p className="text-gray-600 text-xs sm:text-sm">📞 {selectedAddress.alternatePhone} (Alt)</p>
                    )}
                </div>
            ) : (
                <div className="text-center py-4 bg-white rounded-lg sm:rounded-xl border-2 border-dashed border-green-300">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">Add Delivery Address</h3>
                    <p className="text-gray-600 mb-3 text-xs sm:text-sm">Please add your delivery address</p>
                    <button
                        onClick={() => setShowAddressForm(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                    >
                        Add Address Now
                    </button>
                </div>
            )}
        </div>
    );
};

export default AddressSection;
