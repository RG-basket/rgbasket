import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "../../assets/favicon.svg";
import { FaInstagram, FaFacebookF, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { MapPin, Phone, Mail, ArrowRight, Heart } from "lucide-react";

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

const socialHover = {
  hover: { scale: 1.1, rotate: 5, transition: { type: "spring", stiffness: 400 } },
  tap: { scale: 0.95 },
};

const pulseAnimation = {
  initial: { scale: 1, filter: "brightness(100%)" },
  pulse: {
    scale: [1, 1.15, 1],
    filter: ["brightness(100%)", "brightness(110%)", "brightness(100%)"],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Explore",
      links: [
        { text: "Home", url: "/" },
        { text: "Shop All", url: "/products/all" },
        { text: "About Us", url: "/about" },
        { text: "Contact", url: "/contact-us" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { text: "FAQs", url: "/faq" },
        { text: "Shipping & Returns", url: "/order" },
        { text: "Privacy Policy", url: "/privacy" },
        { text: "Terms of Service", url: "/terms" },
      ],
    },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 pt-12 md:pt-20 pb-28 md:pb-10 overflow-hidden border-t border-emerald-100/50">
      {/* Decorative Background Blobs */}
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl opacity-60"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-0 w-64 h-64 bg-lime-100/40 rounded-full blur-3xl opacity-60"
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-8 mb-8 md:mb-16">

          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <motion.img
                src={Logo}
                alt="RG Basket Logo"
                className="w-12 h-12 object-contain drop-shadow-sm"
                variants={pulseAnimation}
                initial="initial"
                animate="pulse"
                whileHover={{ scale: 1.2, rotate: 10, transition: { duration: 0.3 } }}
              />
              <span className="text-2xl font-black tracking-tight transition-all duration-300">
                <span className="text-black">RG</span> <span className="text-emerald-600">Basket</span>
              </span>
            </Link>

            <p className="text-gray-600 leading-relaxed max-w-md text-[15px]">
              Empowering local farmers, delivering freshness.
              <strong className="text-emerald-700 font-semibold"> RG Basket</strong> connects you directly with
              Odisha's finest produce, ensuring quality from farm to your fork.
              Fresh. Transparency. Community.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <SocialButton
                href="https://www.instagram.com/rg.basket?igsh=MW5peWhqeXIybWdhNA=="
                icon={<FaInstagram className="text-xl" />}
                label="Instagram"
                customClass="text-pink-600 bg-pink-50 border-pink-100 md:bg-white md:border-gray-100 md:text-gray-500 md:hover:bg-pink-50 md:hover:text-pink-600 md:hover:border-pink-100"
              />
              <SocialButton
                href="https://x.com/Rgbasket?t=7aE40eFefW7o51PgcFJk5Q&s=08"
                icon={<FaXTwitter className="text-xl" />}
                label="X (Twitter)"
                customClass="text-slate-900 bg-slate-50 border-slate-200 md:bg-white md:border-gray-100 md:text-gray-500 md:hover:bg-slate-100 md:hover:text-slate-900 md:hover:border-slate-200"
              />
              <SocialButton
                href="https://facebook.com/rgbasket"
                icon={<FaFacebookF className="text-xl" />}
                label="Facebook"
                customClass="text-blue-600 bg-blue-50 border-blue-100 md:bg-white md:border-gray-100 md:text-gray-500 md:hover:bg-blue-50 md:hover:text-blue-600 md:hover:border-blue-100"
              />
              <SocialButton
                href="https://youtube.com/@rgbasket?si=8p36hGcaKuzr32C-"
                icon={<FaYoutube className="text-xl" />}
                label="YouTube"
                customClass="text-red-600 bg-red-50 border-red-100 md:bg-white md:border-gray-100 md:text-gray-500 md:hover:bg-red-50 md:hover:text-red-600 md:hover:border-red-100"
              />
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            {footerLinks.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link
                        to={link.url}
                        className="text-gray-500 hover:text-emerald-600 transition-colors duration-200 text-sm font-medium flex items-center gap-1 group"
                      >
                        <ArrowRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all text-emerald-500" />
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <ContactItem
                icon={<MapPin className="w-5 h-5 text-emerald-600" />}
                text="Cuttack, Odisha"
                href="#"
              />
              <ContactItem
                icon={<Mail className="w-5 h-5 text-emerald-600" />}
                text="rgbasket.com@gmail.com"
                href="mailto:rgbasket.com@gmail.com"
              />
              <ContactItem
                icon={<FaWhatsapp className="w-5 h-5 text-emerald-600" />}
                text="+91 9078771530"
                href="https://wa.me/919078771530"
              />
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-emerald-100 pt-6 md:pt-8 mt-4 md:mt-8 flex flex-col-reverse md:flex-row items-center justify-between gap-4 text-sm text-gray-600 relative z-20">
          <motion.p
            className="text-center md:text-left font-medium"
            variants={pulseAnimation}
            initial="initial"
            animate="pulse"
          >
            © {currentYear} <span className="font-bold text-emerald-700">RG Basket</span>. All rights reserved.
          </motion.p>
          <div className="flex items-center justify-center gap-1.5 font-medium bg-emerald-50/50 px-4 py-2 rounded-full border border-emerald-100/50 backdrop-blur-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>in Odisha</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Helper Components
const SocialButton = ({ href, icon, label, customClass }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className={`w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition-all duration-300 ${customClass} hover:shadow-md hover:-translate-y-1`}
    whileHover="hover"
    whileTap="tap"
    variants={socialHover}
  >
    {icon}
  </motion.a>
);

const ContactItem = ({ icon, text, href }) => (
  <li className="flex items-start gap-3 group">
    <div className="mt-0.5 p-2 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
      {icon}
    </div>
    <a
      href={href}
      className="text-gray-600 hover:text-emerald-700 transition-colors text-sm font-medium pt-1.5 break-all"
    >
      {text}
    </a>
  </li>
);

export default Footer;