import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import Search from "../Products/Search.jsx";
import Logo from "../../assets/favicon.svg";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import MobileDrawer from "./MobileDrawer";
import AutoDetectLocation from "../Address/AutoDetectLocation";
import { FaCoins, FaMapMarkerAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const MOBILE_BREAKPOINT = 768;

const Navbar = ({ onLocationClick, onProfileToggle }) => {
  const { isNonVegTheme, user } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [activeToggle, setActiveToggle] = useState("coins"); // 'coins' or 'location'
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => {
      onProfileToggle?.(!prev);
      return !prev;
    });
  }, [onProfileToggle]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    onProfileToggle?.(false);
  }, [onProfileToggle]);

  const LogoSection = () => (
    <NavLink to="/" className="flex items-center space-x-1.5 hover:opacity-90 transition-opacity shrink-0">
      <img src={Logo} alt="RG" className="w-7 h-7 md:w-8 md:h-8" />
      <span className="text-lg md:text-xl font-black tracking-tighter text-gray-900">
        RG <span className={isNonVegTheme ? "text-red-700" : "text-[#26544a]"}>Basket</span>
      </span>
    </NavLink>
  );

  const RGCoinIcon = ({ active }) => (
    <motion.div 
      animate={{ 
        boxShadow: active ? [
          "0 0 0 0px rgba(251, 191, 36, 0)",
          "0 0 0 6px rgba(251, 191, 36, 0.2)",
          "0 0 0 0px rgba(251, 191, 36, 0)"
        ] : "none"
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`relative overflow-hidden w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
        active 
          ? "bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-600 shadow-md ring-2 ring-amber-100" 
          : "bg-gray-200 text-gray-400"
      }`}
    >
      <span className={`text-[7px] sm:text-[9px] font-black drop-shadow-sm z-10 ${active ? "text-white" : "text-gray-500"}`}>RG</span>
      {active && (
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
        />
      )}
    </motion.div>
  );

  const CompactInfoPill = () => {
    if (!user && activeToggle === "coins") return null;

    return (
      <div className="flex items-center bg-gray-100/80 p-0.5 rounded-full border border-gray-200 h-8 sm:h-10">
        {/* Toggle Icons */}
        <div className="flex items-center gap-1 bg-white/50 rounded-full p-0.5 shadow-inner">
          <button
            onClick={() => setActiveToggle("coins")}
            className="rounded-full transition-all focus:outline-none"
          >
            <RGCoinIcon active={activeToggle === "coins"} />
          </button>
          <button
            onClick={() => setActiveToggle("location")}
            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
              activeToggle === "location" 
                ? (isNonVegTheme ? "bg-red-600 text-white shadow-md ring-2 ring-red-100" : "bg-[#26544a] text-white shadow-md ring-2 ring-emerald-100") 
                : "bg-gray-200 text-gray-400 hover:text-emerald-600"
            }`}
          >
            <FaMapMarkerAlt size={10} />
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="px-2 min-w-0">
          <AnimatePresence mode="wait">
            {activeToggle === "coins" ? (
              <motion.div
                key="coins"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                onClick={() => navigate('/profile')}
                className="flex items-center cursor-pointer whitespace-nowrap"
              >
                <div className="flex flex-col">
                  <span className="text-[7px] sm:text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none">Coins</span>
                  <span className="text-[11px] sm:text-sm font-black text-gray-900 leading-none">{user?.rgCoins || 0}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="loc"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="max-w-[80px] xs:max-w-[120px] sm:max-w-[150px]"
              >
                <AutoDetectLocation compact={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className={`w-full ${isNonVegTheme ? 'bg-red-50/95' : 'bg-white/95'} backdrop-blur-md shadow-md z-[100] sticky top-0`}>
        {/* Desktop */}
        {!isMobile && (
          <div className="container mx-auto flex items-center justify-between py-2 px-4 gap-4">
            <div className="flex items-center gap-6">
              <LogoSection />
              <CompactInfoPill />
            </div>
            <div className="flex-1 max-w-md">
              <Search />
            </div>
            <DesktopNav
              isMobile={isMobile}
              isDrawerOpen={isDrawerOpen}
              toggleDrawer={toggleDrawer}
              closeDrawer={closeDrawer}
              onLocationClick={onLocationClick}
            />
          </div>
        )}

        {/* Mobile */}
        {isMobile && (
          <div className="container mx-auto px-3">
            <div className="flex items-center justify-between py-2 gap-2">
              <LogoSection />
              <div className="flex items-center gap-2 overflow-hidden">
                <CompactInfoPill />
              </div>
            </div>
            <div className="pb-3">
              <Search mobile={true} />
            </div>
          </div>
        )}
      </header>

      {isMobile && (
        <>
          <MobileNav toggleDrawer={toggleDrawer} />
          <MobileDrawer
            isMobile={isMobile}
            isDrawerOpen={isDrawerOpen}
            closeDrawer={closeDrawer}
          />
        </>
      )}
    </>
  );
};

export default Navbar;
