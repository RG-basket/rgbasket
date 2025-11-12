import { useEffect, useState } from "react";
import {
  FiMapPin,
  FiShoppingCart,
  FiGrid,
  FiUser,
  FiHome,
  FiLogOut,
  FiClipboard,
  FiPhoneCall,
} from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import { useappcontext } from "../../context/appcontext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import Search from "../Products/Search.jsx";
import Logo from "../../assets/favicon.svg"

const Navbar = ({ onLocationClick }) => {
  const { isLoggedIn, setShowUserLogin, user, logout, getCartCount } =
    useappcontext();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [clickedIcon, setClickedIcon] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      closeDrawer();
    }
  };

  const handleIconClick = (iconName) => {
    setClickedIcon(iconName);
    setTimeout(() => setClickedIcon(null), 300);
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, y: -2 },
    tap: { scale: 0.9 },
    active: { scale: 1.15, color: "#26544a" },
  };

  const dropdownVariants = {
    closed: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
    open: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  };

  const drawerVariants = {
    closed: { y: "100%", transition: { duration: 0.4, ease: "easeInOut" } },
    open: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.6,
      },
    },
  };

  // 🔹 Simplified cart badge animation
  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.4 },
    visible: {
      opacity: 1,
      scale: 0.8,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  const NavIcon = ({
    item,
    isActive,
    onClick,
    showBadge = false,
    icon: Icon,
  }) => {
    const isClicked = clickedIcon === item;
    const isActiveState = isActive || isClicked;

    return (
      <motion.div
        variants={iconVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        animate={isActiveState ? "active" : "initial"}
        className="relative"
        onClick={onClick}
      >
        <Icon className="text-xl transition-colors duration-200" />
        {showBadge && getCartCount() > 0 && (
          <motion.span
            key={getCartCount()}
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center shadow-md"
          >
            {getCartCount()}
          </motion.span>
        )}
      </motion.div>
    );
  };

  const UserDropdown = () => (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <motion.img
          whileHover={{ scale: 1.05 }}
          src={user?.photo || "/user-placeholder.png"}
          alt="User"
          className="w-14 h-14 rounded-full object-cover border-2 border-[#26544a]/20"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.name || "User"
            )}&background=26544a&color=fff&size=112&bold=true`;
          }}
        />
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-lg">
            Hello {user?.name || "User"} 👋
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {user?.email || "Signed in with Google"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: "Profile", icon: FiUser, path: "/profile" },
          { label: "My Orders", icon: FiClipboard, path: "/orders" },
          { label: "Contact us", icon: FiPhoneCall, path: "/contact-us" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              closeDrawer();
            }}
            className="flex items-center gap-4 w-full p-3 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-150"
          >
            <item.icon className="text-lg text-[#26544a]" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 w-full p-3 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-150"
          >
            <FiLogOut className="text-lg" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  const UserSection = () => (
    <div className="relative">
      {!isLoggedIn ? (
        <button
          onClick={() => setShowUserLogin(true)}
          className="bg-gradient-to-r from-[#26544a] to-[#1e8c6d] text-white px-6 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <FiUser className="text-sm" /> Login
          </span>
        </button>
      ) : (
        <>
          <motion.button
            variants={iconVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={toggleDrawer}
            className="flex flex-col items-center text-sm text-gray-600 group"
          >
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={user?.photo || "/user-placeholder.png"}
              alt="User"
              className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-[#26544a] transition-all duration-300"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || "User"
                )}&background=26544a&color=fff&size=64&bold=true`;
              }}
            />
            <span className="text-xs font-medium mt-1">Profile</span>
          </motion.button>

          {/* 🔹 Desktop Dropdown */}
          <AnimatePresence>
            {!isMobile && isDrawerOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/10 z-40"
                  onClick={closeDrawer}
                />
                <motion.div
                  variants={dropdownVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="absolute top-full mt-3 right-0 w-80 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <UserDropdown />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );

  // 🔹 Mobile Drawer Component (Separate from UserSection)
  const MobileDrawer = () => (
    <AnimatePresence>
      {isMobile && isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {isLoggedIn ? (
                <UserDropdown />
              ) : (
                <div className="text-center py-8">
                  <motion.img
                    src={
                      user?.photo ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name || "User"
                      )}&background=26544a&color=fff&size=64&bold=true`
                    }
                    alt="User"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#26544a]/20 mx-auto mb-4"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name || "User"
                      )}&background=26544a&color=fff&size=64&bold=true`;
                    }}
                  />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Welcome!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Login to access your account and personalized features
                  </p>
                  <button
                    onClick={() => {
                      setShowUserLogin(true);
                      closeDrawer();
                    }}
                    className="w-full bg-gradient-to-r from-[#26544a] to-[#1e8c6d] text-white py-4 rounded-xl font-semibold shadow-lg"
                  >
                    Login to Continue
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const DesktopNav = () => (
    <div className="hidden md:flex items-center space-x-8">
      {["location", "cart", "category"].map((item) => {
        if (item === "location") {
          return (
            <button
              key={item}
              onClick={onLocationClick}
              className="flex flex-col items-center text-sm text-gray-600 hover:text-[#26544a]"
            >
              <FiMapPin className="text-xl mb-1" />
              <span className="text-xs font-medium">Location</span>
            </button>
          );
        }

        const IconComponent = {
          cart: FiShoppingCart,
          category: FiGrid,
        }[item];

        return (
          <NavLink
            key={item}
            to={`/${item}`}
            className={({ isActive }) =>
              `flex flex-col items-center text-sm ${
                isActive ? "text-[#26544a]" : "text-gray-600"
              }`
            }
          >
            {({ isActive }) => (
              <div className="group" onClick={() => handleIconClick(item)}>
                <NavIcon
                  item={item}
                  isActive={isActive}
                  icon={IconComponent}
                  showBadge={item === "cart"}
                />
                <span
                  className={`text-xs font-medium ${
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
      <UserSection />
    </div>
  );

  const MobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md z-50 md:hidden">
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
                  isActive ? "text-[#26544a]" : "text-gray-600"
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
                  onClick={() => handleIconClick(item)}
                  className="flex flex-col items-center p-2 rounded-xl"
                >
                  <NavIcon
                    item={item}
                    isActive={isActive}
                    icon={IconComponent}
                    showBadge={item === "cart"}
                  />
                  <span className="text-xs font-medium mt-1">
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
          <span className="text-xs font-medium mt-1">Profile</span>
        </motion.button>
      </div>
    </nav>
  );

  return (
    <>
      {/* 🔹 Header no longer changes on scroll */}
      <header className="w-full bg-white z-10 transition-all duration-300">
        <div className="pt-4 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <NavLink
                to="/"
                className="flex items-center space-x-3 text-3xl font-extrabold text-gray-900 tracking-tight"
              >
                <img
                  src={Logo}
                  alt="RG Basket Logo"
                  className="w-10 h-10"
                />
                RG <span className="text-[#26544a]">Basket</span>
              </NavLink>
            </motion.div>

            <div className="flex-1 max-w-2xl hidden md:block">
              <Search />
            </div>

            <button
              onClick={onLocationClick}
              className="md:hidden shrink-0 p-2 rounded-xl bg-gray-100 text-[#26544a]"
            >
              <FiMapPin className="text-xl" />
            </button>

            <DesktopNav />
          </div>

          <div className="md:hidden w-full mt-4">
            <Search mobile={true} />
          </div>
        </div>
      </header>
      <MobileNav />
      <MobileDrawer /> {/* 🔹 Add this line - Mobile drawer is now separate */}
    </>
  );
};

export default Navbar;
