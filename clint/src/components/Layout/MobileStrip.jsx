// src/components/Navbar/MobileStrip.jsx
import AutoDetectLocation from "../Address/AutoDetectLocation";
import SlotSelector from "../SlotSelector";

const MobileStrip = () => {
  return (
    <div className="md:hidden w-full bg-white shadow-sm border-t border-gray-200 px-3 py-2 flex items-center gap-3">
      {/* Location pill */}
      <div className="flex-1 bg-gradient-to-r from-[#26544a]/10 to-emerald-50 rounded-xl px-3 py-2 border border-[#26544a]/20">
        <AutoDetectLocation />
      </div>

      {/* Slot selector pill */}
      <div className="flex-1 bg-gradient-to-r from-emerald-50 to-[#26544a]/10 rounded-xl px-3 py-2 border border-[#26544a]/20">
        <SlotSelector
          onSlotChange={(slot) => console.log("Mobile slot selected:", slot)}
        />
      </div>
    </div>
  );
};

export default MobileStrip;