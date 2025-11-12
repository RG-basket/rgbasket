import React from "react";
import { motion } from "framer-motion";
import { serviceablePincodes } from "../../assets/assets";

const ServiceableBanner = () => {
  // animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 12,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 80 },
    },
  };

  return (
    <motion.div
      className="bg-white border border-green-200 rounded-xl px-4 py-5 shadow-md text-center mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-green-700 font-semibold text-base mb-3"
        variants={itemVariants}
      >
        RG Basket delivers to these areas in Cuttack:
      </motion.h2>

      <motion.div
        className="flex flex-wrap justify-center gap-2"
        variants={containerVariants}
      >
        {serviceablePincodes.map(({ pincode, area }, index) => (
          <motion.div
            key={index}
            className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-300 transition-transform duration-200 hover:-translate-y-1 hover:shadow"
            variants={itemVariants}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {area} ({pincode})
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ServiceableBanner;
