import { motion } from "framer-motion";
import { FiUser, FiClipboard, FiPhoneCall, FiLogOut, FiAlertCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";

const UserDropdown = ({ closeDrawer }) => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      closeDrawer();
    }
  };

  const menuItems = [
    { label: "Profile", icon: FiUser, path: "/profile" },
    { label: "My Orders", icon: FiClipboard, path: "/orders" },
    { label: "Report Issue", icon: FiAlertCircle, path: "/complaint" },
    { label: "Contact us", icon: FiPhoneCall, path: "/contact-us" },
  ];

  return (
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
        {menuItems.map((item) => (
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
};

export default UserDropdown;