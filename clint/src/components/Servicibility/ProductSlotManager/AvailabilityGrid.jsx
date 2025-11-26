import React from 'react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityGrid = ({
    selectedProduct,
    slots,
    restrictions,
    loading,
    toggleSlotAvailability,
    toggleDayAvailability
}) => {
    // Check if a specific day-slot combination is unavailable
    const isSlotUnavailable = (dayOfWeek, slotName) => {
        const restriction = restrictions.find(r => r.dayOfWeek === dayOfWeek);
        return restriction?.unavailableSlots?.includes(slotName) || false;
    };

    if (!selectedProduct) {
        return (
            <div className="bg-white rounded-lg shadow border p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Product Selected</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Select a product from the list to configure its slot availability</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure availability by day and slot</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedProduct.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {selectedProduct.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>
            </div>

            {/* Availability Grid */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border p-3 text-left text-sm font-medium text-gray-700 w-32">Day</th>
                            {slots.map(slot => (
                                <th key={slot._id} className="border p-3 text-center text-sm font-medium text-gray-700">
                                    <div className="font-semibold">{slot.name}</div>
                                    <div className="text-xs text-gray-500 font-normal mt-1">
                                        {slot.startTime} - {slot.endTime}
                                    </div>
                                </th>
                            ))}
                            <th className="border p-3 text-center text-sm font-medium text-gray-700 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS_OF_WEEK.map(day => {
                            const dayRestriction = restrictions.find(r => r.dayOfWeek === day);
                            const allUnavailable = dayRestriction?.unavailableSlots?.length === slots.length;

                            return (
                                <tr key={day} className="hover:bg-gray-50 transition-colors">
                                    <td className="border p-3 font-medium text-sm text-gray-900 bg-gray-50/50">{day}</td>
                                    {slots.map(slot => {
                                        const unavailable = isSlotUnavailable(day, slot.name);
                                        return (
                                            <td key={slot._id} className="border p-2 text-center">
                                                <button
                                                    onClick={() => toggleSlotAvailability(day, slot.name)}
                                                    disabled={loading}
                                                    className={`w-full py-2 px-3 rounded font-medium text-xs sm:text-sm transition-all duration-200 transform active:scale-95 ${unavailable
                                                        ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                                                        : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                                                        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {unavailable ? 'Unavailable' : 'Available'}
                                                </button>
                                            </td>
                                        );
                                    })}
                                    <td className="border p-2 text-center">
                                        <button
                                            onClick={() => toggleDayAvailability(day)}
                                            disabled={loading}
                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors w-full ${allUnavailable
                                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                                : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {allUnavailable ? 'Enable All' : 'Disable All'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center gap-6 text-sm border-t pt-4">
                <span className="text-gray-500 font-medium">Legend:</span>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Available for delivery</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span className="text-gray-600">Unavailable for delivery</span>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityGrid;
