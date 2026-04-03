import React from 'react';

const DeliveryInstruction = ({ instruction, setInstruction }) => {
    const quickOptions = [
        { label: "Don't ring bell", emoji: "🔕" },
        { label: "Leave with guard", emoji: "👮" },
        { label: "Leave at door", emoji: "🚪" },
        { label: "Be aware of dog", emoji: "🐕" },
        { label: "Call before arrival", emoji: "📞" },
    ];

    const toggleOption = (option) => {
        const optionText = `${option.emoji} ${option.label}`;
        let currentInstructions = instruction.split(',').map(i => i.trim()).filter(i => i !== "");
        
        if (currentInstructions.includes(optionText)) {
            // Remove it
            currentInstructions = currentInstructions.filter(i => i !== optionText);
        } else {
            // Add it
            currentInstructions.push(optionText);
        }
        
        setInstruction(currentInstructions.join(', '));
    };

    const isSelected = (option) => {
        const optionText = `${option.emoji} ${option.label}`;
        return instruction.includes(optionText);
    };

    return (
        <div className="mb-6 bg-white rounded-2xl p-3 border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-lg text-[10px]">📝</span>
                    Delivery Instructions
                </label>
                {instruction && (
                    <button 
                        onClick={() => setInstruction('')}
                        className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Compact Manual Horizontal Scroller */}
            <div className="flex overflow-x-auto pb-2 gap-1.5 no-scrollbar -mx-1 px-1">
                {quickOptions.map((option, index) => {
                    const selected = isSelected(option);
                    return (
                        <button
                            key={index}
                            onClick={() => toggleOption(option)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border-2 ${
                                selected 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-50 scale-95' 
                                : 'bg-emerald-50/50 border-emerald-50 text-emerald-700 hover:border-emerald-100'
                            }`}
                        >
                            <span className="text-sm">{option.emoji}</span>
                            <span className="whitespace-nowrap">{option.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="relative mt-1">
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value.slice(0, 1000))}
                    placeholder="Specific instructions..."
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-2.5 text-[11px] font-medium focus:bg-white focus:border-emerald-500 outline-none resize-none transition-all placeholder:text-gray-400 min-h-[60px]"
                />
                <div className="absolute bottom-2 right-2 text-[9px] font-black text-gray-300 pointer-events-none">
                    {instruction.length}/1000
                </div>
            </div>
            
            <div className="mt-1.5 flex items-center gap-1.5 opacity-70">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                    Instructions shared with delivery hero
                </p>
            </div>
        </div>
    );
};

export default DeliveryInstruction;
