import React from 'react';

const DeliveryInstruction = ({ instruction, setInstruction }) => {
    return (
        <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">📝</span> Add Instruction (optional)
            </label>
            <div className="relative">
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value.slice(0, 1000))}
                    placeholder="Add delivery instruction (optional)"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-green-500 focus:border-green-500 outline-none resize-none bg-white"
                    rows="3"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
                    {instruction.length}/1000
                </div>
            </div>
        </div>
    );
};

export default DeliveryInstruction;
