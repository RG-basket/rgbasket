import { NavLink } from "react-router-dom";
import { FiShoppingCart, FiGrid } from "react-icons/fi";
import NavIcon from "./NavIcon";
import UserSection from "./UserSection";

const DesktopNav = ({ isMobile, isDrawerOpen, toggleDrawer, closeDrawer }) => {
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
                isActive ? "text-[#26544a]" : "text-gray-600"
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
                  className={`text-xs font-medium mt-1 ${
                    isActive ? "font-semibold" : "group-hover:font-semibold"
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </span>
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