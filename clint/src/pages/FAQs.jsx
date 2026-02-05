import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      category: "Delivery & Areas",
      questions: [
        {
          question: "Where do you deliver?",
          answer: "We currently deliver specifically to Cuttack city and its immediate surrounding areas. Enter your pincode on the home page to check if we serve your exact location."
        },
        {
          question: "What are the delivery charges?",
          answer: "We charge a standard delivery fee of ₹29. The free delivery threshold depends on your location Please check the delivery details in your cart after entering your address."
        },
        {
          question: "What are your delivery slots?",
          answer: "We offer multiple daily slots: Morning, Noon, and Evening. For 'Quick Commerce' items, we aim to deliver within 60 minutes depending on your location."
        }
      ]
    },
    {
      category: "Ordering & Returns",
      questions: [
        {
          question: "Can I cancel my order?",
          answer: "Orders can be cancelled anytime BEFORE they are marked as 'Out for Delivery'. Once our delivery partner is on the way, we are unable to process cancellations."
        },
        {
          question: "What is your return policy?",
          answer: "We offer a 2-day (48-hour) window for quality-related returns. For fresh items, we encourage checking them at the door; if you're not completely satisfied, you can return them immediately to our delivery executive."
        },
        {
          question: "What if I receive the wrong item?",
          answer: "If we make a mistake, please let us know with photos of the product and original packaging within 6 hours. We are committed to resolving your concern within 48 hours."
        }
      ]
    },
    {
      category: "Payments & Safety",
      questions: [
        {
          question: "Is Cash on Delivery (COD) available?",
          answer: "Yes, we happily accept COD! To keep our services fair for everyone, we monitor for repeated order refusals. Consistently declining COD orders without a valid quality reason may lead to service restrictions."
        },
        {
          question: "Are my online payments secure?",
          answer: "Absolutely. We use industry-standard security to ensure your payment details are protected and 100% safe."
        },
        {
          question: "Why do my fresh items look slightly different from the photos?",
          answer: "Natural produce is unique! Variations in shape and color are normal for fresh harvest, but we always guarantee the quality and taste are premium."
        }
      ]
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
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find quick answers to common questions about RG Basket.
          </p>
        </motion.div>

        {/* FAQ Categories & Questions */}
        <div className="space-y-12">
          {faqCategories.map((category, catIdx) => (
            <div key={catIdx}>
              <h2 className="text-2xl font-bold text-green-800 mb-6 border-b-2 border-green-200 pb-2">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, qIdx) => {
                  const globalIdx = `${catIdx}-${qIdx}`;
                  return (
                    <motion.div
                      key={globalIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qIdx * 0.05 }}
                      className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenIndex(openIndex === globalIdx ? null : globalIdx)}
                        className="w-full p-5 text-left flex justify-between items-center hover:bg-green-50/50 transition-colors"
                      >
                        <span className="text-lg font-semibold text-gray-900 leading-tight">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{ rotate: openIndex === globalIdx ? 180 : 0 }}
                          className="ml-4 text-green-600"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.span>
                      </button>

                      <AnimatePresence>
                        {openIndex === globalIdx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                              <p className="text-gray-700 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Still Have Questions?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/60 p-5 rounded-2xl border border-green-100">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="font-bold text-gray-900 mb-1">Call Support</h3>
              <p className="text-emerald-700 font-semibold">+91-6370810878</p>
              <p className="text-sm text-gray-500">7:00 AM - 10:00 PM</p>
            </div>
            <div className="bg-white/60 p-5 rounded-2xl border border-green-100">
              <div className="text-3xl mb-3">✉️</div>
              <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
              <p className="text-emerald-700 font-semibold">rgbasketbusiness@gmail.com</p>
              <p className="text-sm text-gray-500">Quick response within 2 hours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQs;