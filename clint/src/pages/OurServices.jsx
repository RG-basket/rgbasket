import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

const OurServices = () => {
  const [activeService, setActiveService] = useState(0);
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Simplified transforms for better performance
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  const services = [
    {
      icon: '🛒',
      title: 'Easy Online Shopping',
      description: 'Browse and shop from our collection with a user-friendly interface designed for seamless shopping experience.',
      features: ['Easy navigation', 'Product categories', 'Search functionality', 'Simple checkout']
    },
    {
      icon: '📦',
      title: 'Order Management',
      description: 'Track your orders and manage your purchases with our order management system.',
      features: ['Order tracking', 'Order history', 'Status updates', 'Purchase management']
    },
    {
      icon: '🚚',
      title: 'Delivery Services',
      description: 'Reliable delivery services to get your products to you safely and efficiently.',
      features: ['Delivery options', 'Package tracking', 'Safe delivery', 'Timely service']
    },
    {
      icon: '💳',
      title: 'Secure Payments',
      description: 'Multiple secure payment options for safe and convenient transactions.',
      features: ['Secure transactions', 'Payment methods', 'Payment security', 'Easy checkout']
    },
    {
      icon: '📞',
      title: 'Customer Support',
      description: 'Customer support team ready to assist you with questions or concerns.',
      features: ['Quick response', 'Support channels', 'Problem resolution', 'Customer assistance']
    },
    {
      icon: '🔄',
      title: 'Easy Returns',
      description: 'Hassle-free return policy for customer satisfaction and peace of mind.',
      features: ['Return policy', 'Easy process', 'Customer satisfaction', 'Peace of mind']
    }
  ];

  const stats = [
    { number: 'Quality', label: 'Products', icon: '⭐' },
    { number: 'Reliable', label: 'Service', icon: '🛡️' },
    { number: 'Fast', label: 'Support', icon: '🚀' },
    { number: 'Secure', label: 'Shopping', icon: '🔒' }
  ];

  return (
    <div ref={containerRef} className="min-h-screen mt-3 bg-gradient-to-r from-emerald-50 via-lime-50 to-white relative overflow-hidden">
      {/* Optimized Background with fewer elements */}
      <motion.div 
        className="absolute inset-0 opacity-5"
        style={{ y: backgroundY, opacity }}
      >
        {[...Array(8)].map((_, i) => ( // Reduced from 15 to 8
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
            initial={{
              x: Math.random() * 1000,
              y: Math.random() * 1000,
            }}
            animate={{
              y: [null, -50, -100], // Reduced movement
              opacity: [0, 0.2, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 8, // Reduced duration
              repeat: Infinity,
              delay: Math.random() * 3
            }}
            style={{
              width: Math.random() * 60 + 20, // Smaller elements
              height: Math.random() * 60 + 20,
            }}
          />
        ))}
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }} // Faster transition
          className="text-center mb-12 lg:mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-lime-500 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg">
              Our Services
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            What We Offer
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Discover our comprehensive services designed to provide you with the best shopping experience.
          </motion.p>
        </motion.div>

        {/* Stats Section - Simplified animations */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }} // Animation only once
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 lg:mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl p-4 sm:p-6 text-center shadow-lg border border-emerald-100"
            >
              <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent mb-1">
                {stat.number}
              </div>
              <div className="text-gray-600 text-sm sm:text-base font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile Carousel */}
        <div className="lg:hidden mb-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative"
          >
            <motion.div
              key={activeService}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100"
            >
              <div className="text-4xl mb-4 text-center">
                {services[activeService].icon}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                {services[activeService].title}
              </h3>
              
              <p className="text-gray-600 text-center mb-6 leading-relaxed">
                {services[activeService].description}
              </p>
              
              <ul className="space-y-3">
                {services[activeService].features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center text-gray-700 text-sm"
                  >
                    <span className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full mr-3"></span>
                    {feature}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <div className="flex justify-center space-x-2 mt-6">
              {services.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveService(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeService 
                      ? 'bg-gradient-to-r from-emerald-500 to-lime-500' 
                      : 'bg-emerald-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setActiveService((prev) => (prev - 1 + services.length) % services.length)}
                className="flex items-center space-x-1 text-emerald-600 font-semibold text-sm"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              
              <button
                onClick={() => setActiveService((prev) => (prev + 1) % services.length)}
                className="flex items-center space-x-1 text-emerald-600 font-semibold text-sm"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Desktop Services Grid - Optimized animations */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="hidden lg:block mb-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl mb-4 text-center"
                >
                  {service.icon}
                </motion.div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed text-center">
                  {service.description}
                </p>
                
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: featureIndex * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center text-gray-700 text-sm"
                    >
                      <span className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-full mr-3"></span>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default OurServices;