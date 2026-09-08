import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import Search from "../Products/Search.jsx";
import Logo from "../../assets/favicon.svg";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import MobileDrawer from "./MobileDrawer";
import AutoDetectLocation from "../Address/AutoDetectLocation";
import HeaderSlotSelector from "./HeaderSlotSelector";
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
    const next = !isDrawerOpen;
    setIsDrawerOpen(next);
    onProfileToggle?.(next);
  }, [isDrawerOpen, onProfileToggle]);

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
          "0 0 0 0px rgba(245, 158, 11, 0)",
          "0 0 8px 2px rgba(245, 158, 11, 0.35)",
          "0 0 0 0px rgba(245, 158, 11, 0)"
        ] : "none"
      }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 select-none cursor-pointer"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_4px_rgba(180,83,9,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outer Polished Gold Rim */}
          <linearGradient id="clean-coin-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="clean-coin-rim-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Inner Golden Face */}
          <radialGradient id="clean-coin-face" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="75%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>

          <radialGradient id="clean-coin-face-silver" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </radialGradient>

          {/* Golden RG Text Gradient */}
          <linearGradient id="clean-rg-gold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FEF9C3" />
            <stop offset="70%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="clean-rg-silver" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Shimmer Sweep */}
          <linearGradient id="clean-coin-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <mask id="clean-coin-mask">
            <circle cx="50" cy="50" r="47" fill="white" />
          </mask>
        </defs>

        {/* 1. Outer Golden Rim */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill={active ? "url(#clean-coin-rim)" : "url(#clean-coin-rim-silver)"}
          stroke={active ? "#B45309" : "#64748B"}
          strokeWidth="1.5"
        />

        {/* 2. Inner Golden Disc */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill={active ? "url(#clean-coin-face)" : "url(#clean-coin-face-silver)"}
          stroke={active ? "#B45309" : "#64748B"}
          strokeWidth="1.5"
        />

        {/* 3. Subtle Top Rim Specular Crescent */}
        <path
          d="M 16 34 A 44 44 0 0 1 84 34 A 47 47 0 0 0 16 34 Z"
          fill="#FFFFFF"
          opacity={active ? 0.45 : 0.25}
        />

        {/* 4. Bold, Clean, Highly Visible "RG" */}
        <text
          x="50"
          y="63.5"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', Arial, sans-serif"
          fontWeight="900"
          fontSize="45"
          letterSpacing="-1px"
          fill={active ? "url(#clean-rg-gold)" : "url(#clean-rg-silver)"}
          stroke={active ? "#78350F" : "#334155"}
          strokeWidth="3.2"
          strokeLinejoin="round"
          paintOrder="stroke fill"
          filter="drop-shadow(0 1.5px 2px rgba(120,53,15,0.45))"
        >
          RG
        </text>

        {/* 5. Clean Diamond Star Sparkle (Top-Left Rim) */}
        {active && (
          <g>
            <ellipse cx="23" cy="21" rx="7" ry="0.8" fill="#FFFFFF" opacity="0.85" />
            <ellipse cx="23" cy="21" rx="0.8" ry="7" fill="#FFFFFF" opacity="0.85" />
            <path
              d="M 23 15 Q 23 21 29 21 Q 23 21 23 27 Q 23 21 17 21 Q 23 21 23 15 Z"
              fill="#FFFFFF"
            />
            <circle cx="23" cy="21" r="2.2" fill="#FFFDE7" />
            <circle cx="23" cy="21" r="1.1" fill="#FFFFFF" />
          </g>
        )}

        {/* 6. Dynamic Shimmer Sweep */}
        {active && (
          <g mask="url(#clean-coin-mask)">
            <motion.rect
              x="-60"
              y="-20"
              width="28"
              height="140"
              fill="url(#clean-coin-shimmer)"
              transform="rotate(25 50 50)"
              animate={{ x: [-80, 150] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 2
              }}
            />
          </g>
        )}
      </svg>
    </motion.div>
  );

  const CompactInfoPill = () => {
    if (!user && activeToggle === "coins") return null;

    return (
      <div className="flex items-center bg-gray-100/90 p-0.5 rounded-full border border-gray-200/90 h-9 sm:h-10 shadow-sm">
        {/* Toggle Icons */}
        <div className="flex items-center gap-1 bg-white/70 rounded-full p-0.5 shadow-inner">
          <button
            onClick={() => setActiveToggle("coins")}
            className="rounded-full transition-all focus:outline-none flex items-center justify-center"
            title="RG Coins Wallet"
          >
            <RGCoinIcon active={activeToggle === "coins"} />
          </button>
          <button
            onClick={() => setActiveToggle("location")}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
              activeToggle === "location" 
                ? (isNonVegTheme ? "bg-red-600 text-white shadow-md ring-2 ring-red-100" : "bg-[#26544a] text-white shadow-md ring-2 ring-emerald-100") 
                : "bg-gray-200 text-gray-400 hover:text-emerald-600"
            }`}
            title="Location"
          >
            <FaMapMarkerAlt size={11} />
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="px-2.5 min-w-0">
          <AnimatePresence mode="wait">
            {activeToggle === "coins" ? (
              <motion.div
                key="coins"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                onClick={() => navigate('/profile')}
                className="flex items-center cursor-pointer whitespace-nowrap gap-1.5"
                title="View RG Coins"
              >
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] font-black text-amber-800 uppercase tracking-wider leading-none">
                    RG Coins
                  </span>
                  <span className="text-xs sm:text-sm font-black text-gray-900 leading-none mt-0.5">
                    {user?.rgCoins || 0}
                  </span>
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
              <HeaderSlotSelector />
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
