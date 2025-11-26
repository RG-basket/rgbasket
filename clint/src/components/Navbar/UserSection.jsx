import { motion, AnimatePresence } from "framer-motion";
import { FiUser } from "react-icons/fi";
import { useAppContext } from "../../context/AppContext.jsx";
import UserDropdown from "./UserDropdown.jsx";

const UserSection = ({ isMobile, isDrawerOpen, toggleDrawer, closeDrawer }) => {
  const { isLoggedIn, setShowUserLogin, user } = useAppContext();

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, y: -2 },
    tap: { scale: 0.9 },
  };

  const dropdownVariants = {
    closed: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
    open: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
  };

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => setShowUserLogin(true)}
        className="bg-gradient-to-r from-[#26544a] to-[#1e8c6d] text-white px-6 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300"
      >
        <span className="flex items-center gap-2">
          <FiUser className="text-sm" /> Login
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
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
              <UserDropdown closeDrawer={closeDrawer} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSection;