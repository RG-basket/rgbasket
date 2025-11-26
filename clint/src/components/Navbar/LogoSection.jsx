import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import Logo from "../../assets/favicon.svg";

const LogoSection = () => (
  <motion.div whileHover={{ scale: 1.05 }}>
    <NavLink
      to="/"
      className="flex items-center space-x-3 text-3xl font-extrabold text-gray-900 tracking-tight"
    >
      <img src={Logo} alt="RG Basket Logo" className="w-10 h-10" />
      RG <span className="text-[#26544a]">Basket</span>
    </NavLink>
  </motion.div>
);

export default LogoSection;