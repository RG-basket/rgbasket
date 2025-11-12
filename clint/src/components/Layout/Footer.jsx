import React from "react";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, duration: 0.6 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const logoVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 120, damping: 10, duration: 0.8 },
  },
};

const textGlow = {
  initial: { textShadow: "0 0 0px rgba(0, 86, 80, 0)" },
  hover: {
    textShadow: [
      "0 0 0px rgba(0, 86, 80, 0)",
      "0 0 10px rgba(0, 86, 80, 0.3)",
      "0 0 20px rgba(0, 86, 80, 0.2)",
      "0 0 0px rgba(0, 86, 80, 0)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const pulseAnimation = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const Footer = () => {
  // Inline footer links
  const footerLinks = [
    {
      title: "Quick Links",
      links: [
        { text: "Home", url: "/" },
        { text: "Shop", url: "/products/all" },
        { text: "About Us", url: "/about" },
        { text: "Contact", url: "/contact-us" },
      ],
    },
    {
      title: "Need Help?",
      links: [
        { text: "FAQs", url: "/faq" },
        { text: "Shipping & Returns", url: "/order" },
        { text: "Privacy Policy", url: "/privacy" },
        { text: "Terms of Service", url: "/terms" },
      ],
    },
    {
      title: "Contact Us",
      links: [
        { text: "Email: rgbasket.com@gmail.com", url: "mailto:rgbasket.com@gmail.com" },
        { text: "Phone: +91-6370810878", url: "tel:+916370810878" },
        { text: "Address: Cuttack, Odisha", url: "#" },
      ],
    },
    {
      title: "Follow Us",
      links: [
        { text: "Instagram", url: "#" },
        { text: "Twitter", url: "#" },
        { text: "Facebook", url: "#" },
        { text: "YouTube", url: "#" },
      ],
    },
  ];

  return (
    <motion.div
      className="w-full overflow-x-auto border-b border-gray-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-white px-6 md:px-16 lg:px-24 xl:px-32 relative overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
    >
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 bg-[#005650] rounded-full opacity-5"
        animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-16 h-16 bg-[#00857a] rounded-full opacity-5"
        animate={{ scale: [1, 1.8, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-16 border-b border-gray-500/20 text-gray-600 relative z-10">
        {/* Logo and Description Section */}
        <motion.div className="flex-1" variants={itemVariants}>
          <motion.div className="flex items-center mb-6" variants={logoVariants}>
            <motion.img
              src="/src/assets/favicon.svg"
              alt="Logo"
              className="w-14 h-14 object-contain select-none"
              draggable={false}
              whileHover={{
                scale: 1.1,
                rotate: 5,
                transition: { type: "spring", stiffness: 300 },
              }}
            />
            <motion.span
              className="ml-4 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#005650] to-[#00857a] select-none"
              variants={textGlow}
              initial="initial"
              whileHover="hover"
            >
              RG Basket
            </motion.span>
          </motion.div>

          <motion.p
            className="max-w-[450px] text-lg leading-relaxed"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            RG Basket is Odisha's homegrown farm-to-fork platform, delivering
            fresh essentials directly from trusted local producers to households
            across Cuttack and Bhubaneswar. We believe in transparency, quality,
            and community—cutting out middlemen to ensure fair prices for farmers
            and fresh, reliable products for you.
          </motion.p>
        </motion.div>

        {/* Links Section */}
        <motion.div
          className="flex flex-wrap justify-between w-full md:w-[50%] gap-8"
          variants={containerVariants}
        >
          {footerLinks.map((section, index) => (
            <motion.div
              key={index}
              className="min-w-[140px]"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <motion.h3
                className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2"
                whileHover={{ x: 5 }}
              >
                {section.title}
              </motion.h3>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <motion.li
                    key={i}
                    whileHover={{ x: 5, transition: { type: "spring", stiffness: 400 } }}
                  >
                    <motion.a
                      href={link.url}
                      className="text-base hover:text-[#005650] transition-all duration-300 flex items-center gap-2 group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.span
                        className="opacity-0 group-hover:opacity-100"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      >
                        →
                      </motion.span>
                      {link.text}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer Bottom */}
      <motion.div
        className="py-6 text-center relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.p
          className="text-sm md:text-base text-gray-500/80"
          variants={pulseAnimation}
          initial="initial"
          animate="pulse"
        >
          Copyright {new Date().getFullYear()} ©{" "}
          <motion.a
            href="#"
            className="font-bold text-[#005650] hover:text-[#00857a] transition-colors"
            whileHover={{ scale: 1.1 }}
          >
            RG Basket
          </motion.a>{" "}
          All Right Reserved. 🚀
        </motion.p>

                {/* Social Media Icons */}
        <motion.div
          className="flex justify-center gap-6 mt-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {["Instagram", "Twitter", "Facebook", "YouTube"].map((platform, index) => (
            <motion.a
              key={platform}
              href={
                platform === "Instagram"
                  ? "https://instagram.com/rgbasket"
                  : platform === "Twitter"
                  ? "https://twitter.com/rgbasket"
                  : platform === "Facebook"
                  ? "https://facebook.com/rgbasket"
                  : "https://youtube.com/@rgbasket"
              }
              className="w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-[#005650] border border-white/20 shadow-lg"
              whileHover={{
                scale: 1.2,
                backgroundColor: "rgba(0, 86, 80, 0.1)",
                transition: { type: "spring", stiffness: 400 },
              }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
            >
              {platform === "Instagram" && "📷"}
              {platform === "Twitter" && "🐦"}
              {platform === "Facebook" && "👥"}
              {platform === "YouTube" && "🎥"}
            </motion.a>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Footer;