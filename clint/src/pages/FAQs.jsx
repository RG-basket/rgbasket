import React from 'react';
import { motion } from 'framer-motion';

const FAQs = () => {
  const faqCategories = [
    {
      category: "Ordering & Account",
      questions: [
        {
          question: "How do I create an account?",
          answer: "Click on the 'Login' button in the top right corner and choose 'Create Account'. You can sign up using your email or Google account. Account creation takes less than 2 minutes."
        },
        {
          question: "Can I order without creating an account?",
          answer: "Yes, you can place orders as a guest. However, creating an account allows you to track orders, save addresses, and get personalized recommendations."
        },
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page. Enter your registered email address and we'll send you a password reset link valid for 1 hour."
        },
        {
          question: "Can I modify my order after placing it?",
          answer: "You can modify your order within 30 minutes of placing it. After that, orders enter our processing system and changes may not be possible. Contact customer support for assistance."
        }
      ]
    },
    {
      category: "Delivery & Shipping",
      questions: [
        {
          question: "What are your delivery areas?",
          answer: "We deliver to 5000+ pincodes across major cities. Check serviceability by entering your pincode on the homepage. We're constantly expanding our delivery network."
        },
        {
          question: "What are the delivery charges?",
          answer: "We charge ₹29 for all orders. Free delivery is available on orders above ₹499. Delivery charges cover packaging, handling, and transportation costs."
        },
        {
          question: "Can I change my delivery address?",
          answer: "Yes, you can change delivery address within 1 hour of order placement. After that, contact customer support. Address changes are subject to delivery area availability."
        },
        {
          question: "What are your delivery time slots?",
          answer: "We offer five slots daily: Morning - First Half (7:00-8:30 AM), Morning - Second Half (8:30-10:00 AM), Noon (12:00-2:00 PM), Night - First Half (5:00-6:30 PM), and Night - Second Half (6:30-8:00 PM). Next-day delivery is available for orders placed before 8:00 PM."
        }
      ]
    },
    {
      category: "Payments & Refunds",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept Credit/Debit Cards, UPI, Net Banking, and Cash on Delivery. All online payments are secured with 128-bit SSL encryption."
        },
        {
          question: "Is Cash on Delivery available?",
          answer: "Yes, COD is available for orders up to ₹5000. Please keep exact change ready for the delivery executive."
        },
        {
          question: "How long do refunds take?",
          answer: "Refunds are processed within 3-5 business days. For online payments, it takes 5-7 days to reflect in your account. COD refunds are processed via bank transfer."
        },
        {
          question: "My payment failed but amount was deducted?",
          answer: "Don't worry! The amount will be automatically refunded within 24 hours. If not, contact our support with transaction details for immediate assistance."
        }
      ]
    },
    {
      category: "Products & Quality",
      questions: [
        {
          question: "How do you ensure product quality?",
          answer: "We source directly from farmers and certified suppliers. All products undergo quality checks. We maintain proper storage and cold chain for perishables."
        },
        {
          question: "What if I receive damaged products?",
          answer: "Report damaged items within 6 hours of delivery with photos. We'll arrange replacement or refund. Our quality team investigates all complaints."
        },
        {
          question: "Do you have organic products?",
          answer: "Yes, we have a dedicated 'Organic' section with certified organic fruits, vegetables, and groceries. Look for the organic badge on products."
        },
        {
          question: "Can I request specific ripeness for fruits?",
          answer: "Yes! During checkout, you can add special instructions for fruit ripeness. We'll do our best to accommodate your preferences."
        }
      ]
    },
    {
      category: "Returns & Cancellations",
      questions: [
        {
          question: "What is your return policy?",
          answer: "We accept returns within 24 hours for eligible products. Fresh produce returns must be reported within 6 hours. Packaged goods can be returned within 7 days if unopened."
        },
        {
          question: "How do I return an item?",
          answer: "Go to 'My Orders', select the order, and click 'Return Item'. Our executive will collect during next delivery. Refunds processed after verification."
        },
        {
          question: "What items cannot be returned?",
          answer: "Fresh fruits/vegetables (unless spoiled), dairy products, frozen foods, personalized items, and opened packaged goods for hygiene reasons."
        },
        {
          question: "Can I cancel my order?",
          answer: "You can cancel orders within 1 hour of placement. After processing begins, cancellation may not be possible. Contact support for urgent cancellations."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find quick answers to common questions about RG Basket
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for answers..."
              className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-orange-200">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <motion.div
                    key={faqIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (categoryIndex * 0.1) + (faqIndex * 0.05) }}
                    className="bg-white rounded-xl shadow-md border border-orange-100 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">
                          Q
                        </span>
                        {faq.question}
                      </h3>
                      <div className="flex">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1">
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
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-orange-50 border border-orange-200 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Still Need Help?
          </h2>
          <p className="text-gray-700 text-center mb-6">
            Our customer support team is here to assist you
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📞 Call Us</h3>
              <p className="text-gray-700">+91-6370810878</p>
              <p className="text-sm text-gray-600">7:00 AM - 10:00 PM</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✉️ Email</h3>
              <p className="text-gray-700">support@rgbasket.com</p>
              <p className="text-sm text-gray-600">Response within 2 hours</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">💬 Live Chat</h3>
              <p className="text-gray-700">Available on website</p>
              <p className="text-sm text-gray-600">24/7 Support</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQs;