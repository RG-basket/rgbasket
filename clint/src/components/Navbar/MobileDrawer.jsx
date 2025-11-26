import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../../context/AppContext.jsx";
import UserDropdown from "./UserDropdown.jsx";

const MobileDrawer = ({ isMobile, isDrawerOpen, closeDrawer }) => {
  const { isLoggedIn, setShowUserLogin, user } = useAppContext();

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

  return (
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
                <UserDropdown closeDrawer={closeDrawer} />
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
};

export default MobileDrawer;