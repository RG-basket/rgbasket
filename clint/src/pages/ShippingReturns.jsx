import React from 'react';
import { motion } from 'framer-motion';

const ShippingReturns = () => {
  const faqs = [
    {
      question: "What are your delivery areas?",
      answer: "We currently deliver to all major cities and surrounding areas. You can check service availability by entering your pincode on our homepage. Our delivery network covers over 5000+ pincodes across the country."
    },
    {
      question: "What are your delivery timings?",
      answer: "We offer three delivery slots daily: Morning (7:00 AM - 10:00 AM), Afternoon (12:00 PM - 2:00 PM), and Evening (5:00 PM - 8:00 PM). You can choose your preferred slot during checkout. Next-day delivery is available for orders placed before 8:00 PM."
    },
    {
      question: "Is same-day delivery available?",
      answer: "Yes! We offer same-day delivery for orders placed before 12:00 PM. Orders placed after 12:00 PM will be delivered the next day in your chosen time slot. Same-day delivery is subject to product availability and delivery area."
    },
    {
      question: "What is your delivery fee?",
      answer: "We charge a flat delivery fee of ₹29 for all orders. Free delivery is available on orders above ₹499. The delivery fee covers handling, packaging, and transportation costs."
    },
    {
      question: "Can I change my delivery address after placing an order?",
      answer: "You can change your delivery address within 1 hour of placing the order by contacting our customer support. After 1 hour, changes may not be possible as orders enter our processing system."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 24 hours of delivery for eligible products. Fresh produce can be returned if quality issues are reported within 6 hours of delivery. Packaged goods can be returned within 7 days if unopened and in original condition."
    },
    {
      question: "How do I return an item?",
      answer: "To initiate a return, go to 'My Orders' in your account, select the order, and click 'Return Item'. Our delivery executive will collect the return during your next scheduled delivery. Refunds are processed within 3-5 business days."
    },
    {
      question: "What items cannot be returned?",
      answer: "We cannot accept returns for: Fresh fruits and vegetables (unless spoiled/damaged), dairy products, frozen foods, personalized items, and opened packaged goods. These are excluded for hygiene and safety reasons."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, refunds are processed to your original payment method within 3-5 business days after we receive and verify the returned items. For cash on delivery orders, refunds are processed via bank transfer or wallet credit."
    },
    {
      question: "What if I receive damaged or wrong items?",
      answer: "If you receive damaged, spoiled, or incorrect items, please contact us immediately within 6 hours of delivery. Share photos of the issue, and we'll arrange a replacement or refund. Our quality team will investigate and resolve within 24 hours."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Shipping & Returns
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about delivery, shipping, and returns for your RG Basket orders.
          </p>
        </motion.div>

        {/* FAQ Section */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">
                    Q
                  </span>
                  {faq.question}
                </h3>
                <div className="flex">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">
                    A
                  </span>
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-green-50 border border-green-200 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Need More Help?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📞 Call Us</h3>
              <p className="text-gray-700">+91-6370810878</p>
              <p className="text-sm text-gray-600">Available 7:00 AM - 10:00 PM</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✉️ Email Us</h3>
              <p className="text-gray-700">support@rgbasket.com</p>
              <p className="text-sm text-gray-600">Response within 2 hours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingReturns;