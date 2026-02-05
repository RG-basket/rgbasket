import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    // Clear cart items once order is placed
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartSelectedGift');
    localStorage.removeItem('cartInstruction');
    localStorage.removeItem('cartAppliedOfferThreshold');

    // Google Customer Reviews Integration
    if (order && order.userInfo?.email) {
      const script = document.createElement('script');
      script.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
      script.async = true;
      script.defer = true;

      window.renderOptIn = function () {
        window.gapi.load('surveyoptin', function () {
          const deliveryDate = new Date(order.deliveryDate || Date.now());
          const dateString = deliveryDate.toISOString().split('T')[0];

          window.gapi.surveyoptin.render({
            "merchant_id": 5701308546,
            "order_id": order._id || order.id,
            "email": order.userInfo.email,
            "delivery_country": "IN",
            "estimated_delivery_date": dateString,
            "products": (order.items || []).map(item => ({ "gtin": item.gtin || "" }))
          });
        });
      };

      document.head.appendChild(script);
    }

    // Redirect after 5 seconds to give user time to see the review opt-in
    const timer = setTimeout(() => {
      navigate('/orders');
    }, 5000);

    // Cleanup timer if component unmounts
    return () => {
      clearTimeout(timer);
      const script = document.querySelector('script[src*="apis.google.com/js/platform.js"]');
      if (script) script.remove();
      delete window.renderOptIn;
    };
  }, [navigate, order]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-[#26544a] px-6">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[#26544a]/20 p-8 text-center relative overflow-hidden"
      >
        {/* Floating subtle background glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-gradient-to-b from-[#26544a]/30 to-transparent blur-2xl"
        ></motion.div>

        {/* Success Icon Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="w-20 h-20 bg-[#26544a]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
        >
          <svg
            className="w-10 h-10 text-[#26544a]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold mb-2"
        >
          Order Placed Successfully!
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-[#26544a]/70 mb-8 leading-relaxed"
        >
          Thank you for your order. We’ve received it and will begin processing right away.
        </motion.p>

        {/* Buttons (still available if user clicks before auto-redirect) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="space-y-4"
        >
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-[#26544a] hover:bg-white hover:text-[#26544a] border border-[#26544a] py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
          >
            View My Orders
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full border border-[#26544a] text-[#26544a] hover:bg-[#26544a] hover:text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.02]"
          >
            Continue Shopping
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;