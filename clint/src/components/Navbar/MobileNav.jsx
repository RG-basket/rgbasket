import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiShoppingCart, FiGrid, FiClipboard, FiUser } from "react-icons/fi";
import NavIcon from "./NavIcon";
import { useAppContext } from "../../context/AppContext.jsx";

const MobileNav = ({ toggleDrawer, onLocationClick }) => {
  const { isNonVegTheme } = useAppContext();
  
  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, y: -2 },
    tap: { scale: 0.9 },
    active: { scale: 1.15, color: isNonVegTheme ? "#ef4444" : "#26544a" },
  };

  const activeColorClass = isNonVegTheme ? "text-red-600" : "text-[#26544a]";

  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${isNonVegTheme ? 'bg-red-50/95' : 'bg-white/95'} backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50 md:hidden transition-colors duration-500`}>
      <div className="flex justify-around items-center h-16 px-2">
        {["home", "category", "cart", "orders"].map((item) => {
          const IconComponent = {
            home: FiHome,
            cart: FiShoppingCart,
            category: FiGrid,
            orders: FiClipboard,
          }[item];

          return (
            <NavLink
              key={item}
              to={`/${item === "home" ? "" : item}`}
              className={({ isActive }) =>
                `flex flex-col items-center text-sm ${
                  isActive ? activeColorClass : "text-gray-600"
                }`
              }
            >
              {({ isActive }) => (
                <motion.div
                  variants={iconVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  animate={isActive ? "active" : "initial"}
                  className="flex flex-col items-center p-2 rounded-xl"
                >
                   <NavIcon
                    item={item}
                    isActive={isActive}
                    icon={IconComponent}
                    showBadge={item === "cart"}
                  />
                  <span className="text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-tighter">
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </span>
                </motion.div>
              )}
            </NavLink>
          );
        })}

        <motion.button
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          onClick={toggleDrawer}
          className="flex flex-col items-center text-sm text-gray-600 p-2 rounded-xl"
        >
          <FiUser className="text-xl" />
          <span className="text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-tighter">Profile</span>
        </motion.button>
      </div>
    </nav>
  );
};

export default MobileNav;