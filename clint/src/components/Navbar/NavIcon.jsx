import { motion } from "framer-motion";
import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";

const NavIcon = ({ item, isActive, onClick, showBadge = false, icon: Icon }) => {
  const { cartCount, isNonVegTheme } = useAppContext();
  const [clickedIcon, setClickedIcon] = useState(null);

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, y: -2 },
    tap: { scale: 0.9 },
    active: { scale: 1.15, color: isNonVegTheme ? "#ef4444" : "#26544a" },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.4 },
    visible: {
      opacity: 1,
      scale: 0.8,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  const handleClick = () => {
    setClickedIcon(item);
    setTimeout(() => setClickedIcon(null), 300);
    onClick?.();
  };

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
      onClick={handleClick}
    >
      <Icon className="text-xl transition-colors duration-200" />
      {showBadge && cartCount > 0 && (
        <motion.span
          key={cartCount}
          variants={badgeVariants}
          initial="hidden"
          animate="visible"
          className={`absolute -top-2 -right-2 ${isNonVegTheme ? 'bg-gray-900 border-white' : 'bg-red-600'} text-white text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[20px] flex items-center justify-center shadow-lg border-2`}
        >
          {cartCount}
        </motion.span>
      )}
    </motion.div>
  );
};

export default NavIcon;