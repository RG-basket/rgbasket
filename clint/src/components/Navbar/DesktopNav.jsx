import { NavLink } from "react-router-dom";
import { FiShoppingCart, FiGrid } from "react-icons/fi";
import NavIcon from "./NavIcon";
import UserSection from "./UserSection";
import { useAppContext } from "../../context/AppContext.jsx";

const DesktopNav = ({ isMobile, isDrawerOpen, toggleDrawer, closeDrawer }) => {
  const { isNonVegTheme } = useAppContext();
  
  const activeColorClass = isNonVegTheme ? "text-red-600" : "text-[#26544a]";

  return (
    <div className="hidden md:flex items-center space-x-8">
      {["cart", "category"].map((item) => {
        const IconComponent = {
          cart: FiShoppingCart,
          category: FiGrid,
        }[item];

        return (
          <NavLink
            key={item}
            to={`/${item}`}
            className={({ isActive }) =>
              `flex flex-col items-center ${
                isActive ? activeColorClass : "text-gray-600"
              }`
            }
          >
            {({ isActive }) => (
              <div className="group flex flex-col items-center">
                <NavIcon
                  item={item}
                  isActive={isActive}
                  icon={IconComponent}
                  showBadge={item === "cart"}
                />
                <span
                  className={`text-xs font-bold mt-1 uppercase tracking-tight ${
                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </span>
                {isActive && (
                  <div className={`w-4 h-0.5 rounded-full mt-0.5 ${isNonVegTheme ? 'bg-red-500' : 'bg-emerald-600'} animate-in fade-in slide-in-from-top-1`} />
                )}
              </div>
            )}
          </NavLink>
        );
      })}
      <UserSection
        isMobile={isMobile}
        isDrawerOpen={isDrawerOpen}
        toggleDrawer={toggleDrawer}
        closeDrawer={closeDrawer}
      />
    </div>
  );
};

export default DesktopNav;