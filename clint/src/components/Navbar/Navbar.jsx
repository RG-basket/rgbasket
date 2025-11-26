import { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import Search from "../Products/Search.jsx";
import Logo from "../../assets/favicon.svg";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import MobileDrawer from "./MobileDrawer";
import AutoDetectLocation from "../Address/AutoDetectLocation";
import SlotSelector from "../Address/SlotSelector";

const MOBILE_BREAKPOINT = 768;

const Navbar = ({ onLocationClick }) => {
  const { getCartCount } = useAppContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const navigate = useNavigate();

  // Throttled resize handler
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleSlotChange = useCallback((slot) => {
    console.log("Selected slot:", slot);
    // setSelectedSlot is already called in SlotSelector, no need to call again
  }, []);

  const LogoSection = () => (
    <NavLink
      to="/"
      className="flex items-center space-x-2 text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight hover:opacity-90 transition-opacity"
      aria-label="RG Basket Home"
    >
      <img
        src={Logo}
        alt="RG Basket Logo"
        className="w-8 h-8 md:w-10 md:h-10"
      />
      <span>RG <span className="text-[#26544a]">Basket</span></span>
    </NavLink>
  );

  return (
    <>
      <header className="w-full bg-white shadow-md z-20 sticky top-0">

        {/* Desktop Layout */}
        {!isMobile && (
          <div className="container mx-auto flex items-center justify-between py-3 px-4 gap-4">

            <div className="flex items-center gap-4 flex-shrink-0 min-w-0">
              <LogoSection />
              <div className="max-w-[200px] min-w-0">
                <AutoDetectLocation />
              </div>
            </div>

            <div className="flex-1 max-w-lg min-w-0">
              <Search />
            </div>

            <div className="flex-shrink-0">
              <SlotSelector onSlotChange={handleSlotChange} />
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <DesktopNav
                isMobile={isMobile}
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                closeDrawer={closeDrawer}
                onLocationClick={onLocationClick}
              />
            </div>

          </div>
        )}

        {/* MOBILE LAYOUT — UPDATED EXACTLY AS YOU WANT */}
        {isMobile && (
          <div className="container mx-auto">

            {/* ROW 1: LOGO LEFT + LOCATION RIGHT */}
            <div className="flex items-center justify-between py-2 px-3">
              <LogoSection />
              <div className="truncate max-w-[150px] text-right">
                <AutoDetectLocation />
              </div>
            </div>

            {/* ROW 2: SLOT SELECTOR (FIRST, CENTERED, FULL WIDTH) */}
            <div className="w-full px-3 pb-2">
              <SlotSelector onSlotChange={handleSlotChange} />
            </div>

            {/* ROW 3: SEARCH BAR BELOW SLOT */}
            <div className="w-full px-3 pb-3">
              <Search mobile={true} />
            </div>

          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
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
