import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BottomBanner = () => {
  const [isInView, setIsInView] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const ref = useRef(null);

  // High-quality, reliable grocery images from Unsplash with specific IDs
  const carouselImages = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      title: "Fresh Vegetables",
      description: "Farm-fresh seasonal vegetables"
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1620366215782-2d2d6a4d4c4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      title: "Daily Essentials",
      description: "All your grocery needs covered"
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      title: "Quality Fruits",
      description: "Fresh and nutritious fruits"
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      title: "Kitchen Staples",
      description: "Essential ingredients for cooking"
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      title: "Organic Produce",
      description: "Naturally grown healthy options"
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      title: "Fresh Dairy",
      description: "Daily fresh milk and dairy products"
    }
  ];

  const features = [
    {
      icon: "🕒",
      title: "Scheduled Delivery",
      description: "Choose your preferred delivery time slot for convenience"
    },
    {
      icon: "🌱",
      title: "Freshness Guaranteed",
      description: "Quality produce straight from trusted local sources"
    },
    {
      icon: "💰",
      title: "Affordable Prices",
      description: "Competitive pricing without compromising on quality"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <div ref={ref} className="relative py-12 lg:py-16 bg-gradient-to-br from-[#f0f9f4] via-white to-[#e1f3e8] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-48 h-48 lg:w-72 lg:h-72 bg-[#2e8b57]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-64 h-64 lg:w-96 lg:h-96 bg-[#3cb371]/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 lg:mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-[#2e8b57]/20 rounded-2xl px-4 py-2 lg:px-6 lg:py-3 shadow-lg mb-4"
          >
            <div className="w-2 h-2 bg-[#2e8b57] rounded-full animate-pulse" />
            <span className="text-xs lg:text-sm font-semibold text-[#2e8b57]">SG Basket - Fresh Groceries</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4"
          >
            Fresh Groceries, <span className="text-[#2e8b57]">Delivered Daily</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Get fresh groceries delivered from local producers straight to your doorstep in Cuttack & Bhubaneswar
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Column - Carousel */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            {/* Carousel Container */}
            <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="w-full h-full relative"
                >
                  <img
                    src={carouselImages[currentSlide].url}
                    alt={carouselImages[currentSlide].title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to a reliable placeholder if image fails
                      e.target.src = `https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
                    }}
                  />
                  
                  {/* Image Overlay with Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end">
                    <div className="p-4 lg:p-6 text-white w-full">
                      <motion.h3 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg lg:text-xl font-bold mb-1"
                      >
                        {carouselImages[currentSlide].title}
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-xs lg:text-sm opacity-90"
                      >
                        {carouselImages[currentSlide].description}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 border border-gray-200"
                aria-label="Previous image"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110 border border-gray-200"
                aria-label="Next image"
              >
                <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'bg-white scale-125' : 'bg-white/60'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 }}
              className="mt-6 lg:absolute lg:-bottom-4 lg:left-4 lg:right-4"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 shadow-xl border border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg lg:text-xl font-bold text-[#2e8b57]">1000+</div>
                    <div className="text-xs lg:text-sm text-gray-600">Happy Families</div>
                  </div>
                  <div>
                    <div className="text-lg lg:text-xl font-bold text-[#2e8b57]">50+</div>
                    <div className="text-xs lg:text-sm text-gray-600">Local Farmers</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4 lg:space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  y: -2,
                  transition: { duration: 0.2 }
                }}
                className="group relative"
              >
                <div className="relative bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100/50 hover:border-[#2e8b57]/30 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-3 lg:gap-4">
                    <motion.div
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.3 }
                      }}
                      className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 bg-[#2e8b57] rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <span className="text-lg">{feature.icon}</span>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-1 group-hover:text-[#2e8b57] transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2 }}
          className="text-center mt-12 lg:mt-16"
        >
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(46, 139, 87, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#2e8b57] text-white px-8 py-3 lg:px-10 lg:py-4 rounded-xl lg:rounded-2xl font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <span className="flex items-center gap-2">
              Start Shopping Now
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="group-hover:translate-x-1 transition-transform"
              >
                🛒
              </motion.span>
            </span>
          </motion.button>

          {/* Trust Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.4 }}
            className="flex flex-wrap justify-center gap-4 mt-6 text-gray-600 text-xs lg:text-sm"
          >
            {[
              { icon: "🚚", text: "Fast Delivery" },
              { icon: "⭐", text: "Rated 4.9/5" },
              { icon: "💳", text: "Secure Payment" },
              { icon: "🌱", text: "Farm Fresh" }
            ].map((badge, index) => (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.5 + index * 0.1 }}
                className="flex items-center gap-1 font-medium bg-white/80 backdrop-blur-sm px-3 py-1 lg:px-4 lg:py-2 rounded-full border border-gray-200"
              >
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Trusted By Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1.6 }}
            className="mt-8"
          >
            <p className="text-gray-500 text-sm lg:text-base mb-2">Trusted by Thousands</p>
            <p className="text-base lg:text-lg font-semibold text-gray-700">Loved by 10,000+ happy customers</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BottomBanner;