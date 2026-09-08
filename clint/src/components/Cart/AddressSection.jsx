import React from 'react';
import { motion } from 'framer-motion';

const AddressSection = ({
    addresses = [],
    selectedAddress,
    setSelectedAddress,
    loadingAddresses,
    onAddNewAddress,
    onEditAddress,
    onDeleteAddress,
    setShowAddressForm
}) => {
    // Categorize saved addresses into the 3 Blinkit/Instamart slots
    const homeAddress = addresses.find(a => (a.addressType || 'Home') === 'Home');
    const officeAddress = addresses.find(a => a.addressType === 'Office');
    const otherAddress = addresses.find(a => a.addressType === 'Other');

    const slots = [
        { type: 'Home', icon: '🏠', label: 'Home', address: homeAddress },
        { type: 'Office', icon: '🏢', label: 'Office', address: officeAddress },
        { type: 'Other', icon: '📍', label: otherAddress?.otherLabel || 'Other', address: otherAddress }
    ];

    return (
        <div className="mb-3 sm:mb-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-emerald-800 tracking-wider uppercase">
                        DELIVERY LOCATION
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded-full">
                        {addresses.length}/3 Saved
                    </span>
                </div>
            </div>

            {loadingAddresses ? (
                <div className="text-center py-4 bg-white rounded-xl border border-emerald-200/80 shadow-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent mx-auto mb-1.5"></div>
                    <p className="text-gray-500 text-xs font-medium">Loading saved locations...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Blinkit/Instamart 3 Slots Quick Selector */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {slots.map(slot => {
                            const hasAddress = Boolean(slot.address);
                            const isSelected = hasAddress && selectedAddress && (
                                selectedAddress._id === slot.address._id ||
                                (selectedAddress.addressType || 'Home') === slot.type
                            );

                            return (
                                <motion.div
                                    key={slot.type}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (hasAddress) {
                                            if (setSelectedAddress) setSelectedAddress(slot.address);
                                        } else {
                                            if (onAddNewAddress) {
                                                onAddNewAddress(slot.type);
                                            } else if (setShowAddressForm) {
                                                setShowAddressForm(true);
                                            }
                                        }
                                    }}
                                    className={`relative py-1.5 px-1 sm:py-2.5 sm:px-2 rounded-xl cursor-pointer border transition-all duration-150 flex flex-col items-center justify-center text-center ${
                                        isSelected
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                            : hasAddress
                                                ? 'bg-white border-emerald-200 hover:border-emerald-400 text-gray-800'
                                                : 'bg-white/60 border-dashed border-gray-300 hover:border-emerald-400 text-gray-500'
                                    }`}
                                >
                                    {isSelected && (
                                        <span className="absolute -top-1 -right-1 bg-white text-emerald-700 rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black shadow">
                                            ✓
                                        </span>
                                    )}
                                    <span className="text-base sm:text-lg leading-tight mb-0.5">{slot.icon}</span>
                                    <span className={`text-[11px] sm:text-xs font-bold truncate max-w-full leading-tight ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                        {slot.label}
                                    </span>
                                    <span className={`text-[9px] leading-tight mt-0.5 ${
                                        isSelected
                                            ? 'text-emerald-100 font-semibold'
                                            : hasAddress
                                                ? 'text-emerald-700 font-medium'
                                                : 'text-gray-400 font-medium'
                                    }`}>
                                        {isSelected ? 'Delivering' : hasAddress ? 'Saved' : '+ Add'}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Active Selected Address Details Card - Compact Mobile */}
                    {addresses.length > 0 && selectedAddress ? (
                        <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-emerald-300 shadow-sm relative">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        <span>
                                            {(selectedAddress.addressType || 'Home') === 'Office'
                                                ? '🏢'
                                                : (selectedAddress.addressType || 'Home') === 'Other'
                                                    ? '📍'
                                                    : '🏠'}
                                        </span>
                                        <span className="uppercase tracking-wide">
                                            {selectedAddress.addressType === 'Other' && selectedAddress.otherLabel
                                                ? selectedAddress.otherLabel
                                                : (selectedAddress.addressType || 'Home')}
                                        </span>
                                    </span>

                                    <span className="font-bold text-gray-900 text-xs truncate max-w-[140px] sm:max-w-[200px]">
                                        {selectedAddress.fullName}
                                    </span>

                                    {selectedAddress.isDefault && (
                                        <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                            Default
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onEditAddress) onEditAddress(selectedAddress);
                                            else if (setShowAddressForm) setShowAddressForm(true);
                                        }}
                                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                                    >
                                        Edit
                                    </button>
                                    {onDeleteAddress && (
                                        <button
                                            type="button"
                                            onClick={() => onDeleteAddress(selectedAddress._id)}
                                            className="text-xs text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
                                            title="Delete this location"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-gray-600 text-[11px] leading-snug line-clamp-2 mt-1">
                                {selectedAddress.street}, {selectedAddress.locality}, {selectedAddress.city} - <span className="font-bold text-gray-800">{selectedAddress.pincode}</span>
                                {selectedAddress.landmark && <span className="italic text-gray-400 ml-1">({selectedAddress.landmark})</span>}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium pt-1 border-t border-gray-100 mt-1.5">
                                <span>📞 {selectedAddress.phoneNumber}</span>
                                {selectedAddress.alternatePhone && (
                                    <span>• Alt: {selectedAddress.alternatePhone}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Empty State: No address saved */
                        <div className="text-center py-6 bg-white rounded-2xl border-2 border-dashed border-emerald-300 p-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl">
                                📍
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                                Add a Delivery Location
                            </h3>
                            <p className="text-gray-500 text-xs mb-4 max-w-xs mx-auto">
                                Save up to 3 locations (Home, Office, Other) for instant 1-click orders!
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={() => onAddNewAddress ? onAddNewAddress('Home') : (setShowAddressForm && setShowAddressForm(true))}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <span>🏠</span> Add Home
                                </button>
                                <button
                                    onClick={() => onAddNewAddress ? onAddNewAddress('Office') : (setShowAddressForm && setShowAddressForm(true))}
                                    className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <span>🏢</span> Add Office
                                </button>
                                <button
                                    onClick={() => onAddNewAddress ? onAddNewAddress('Other') : (setShowAddressForm && setShowAddressForm(true))}
                                    className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <span>📍</span> Add Other
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddressSection;
