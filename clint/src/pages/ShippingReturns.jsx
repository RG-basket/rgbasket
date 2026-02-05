import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ShippingReturns = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What are your delivery areas?",
      answer: "We currently deliver specifically to Cuttack city and its immediate surrounding areas. You can check service availability by entering your pincode on our homepage. We are rapidly expanding our network to cover more parts of Odisha."
    },
    {
      question: "What are your delivery timings?",
      answer: "We offer multiple delivery slots daily, including Morning, Noon, and Evening options. You can choose your preferred slot during checkout. For 'Quick Commerce' items, we aim for delivery within the hour depending on your distance from our hub."
    },
    {
      question: "What is your delivery fee?",
      answer: "We charge a standard delivery fee of ₹29 for most orders. The free delivery threshold varies by location. You can see the exact delivery charge for your area in the cart after selecting your address."
    },
    {
      question: "Can I cancel my order?",
      answer: "Yes, you can cancel your order at any time as long as it has not been marked as 'Out for Delivery'. Once the order is out for delivery, cancellation is not possible. You can cancel directly from the 'My Orders' section."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 2 days (48 hours) of delivery for eligible products. Fresh produce should be checked at the time of delivery. If you are not satisfied with the quality, you can return it immediately to the delivery executive."
    },
    {
      question: "What happens if I refuse a Cash on Delivery (COD) order?",
      answer: "To support our farming partners and ensure sustainable prices, we monitor for repeated order cancellations. If orders are consistently refused at the doorstep without a valid quality concern, we may need to restrict future services to that account or address."
    },
    {
      question: "What if I receive the wrong product or there is a mistake?",
      answer: "We strive for perfection, but if we miss the mark, please let us know via the 'Complaint' section. We are committed to resolving your concern or processing your refund/replacement within 48 hours."
    },
    {
      question: "What items cannot be returned?",
      answer: "For food safety and hygiene, we cannot accept returns for opened packaged goods, personal care items, or fresh produce that was correctly delivered but stored improperly later."
    },
    {
      question: "Can I check the freshness at the time of delivery?",
      answer: "We highly encourage it! Please check your fresh fruits, veggies, and meat while the delivery executive is there. If any item doesn't meet your quality standards, you can return it immediately for a prompt replacement or credit."
    },
    {
      question: "What if an item is out of stock after I order?",
      answer: "In the rare event an item is unavailable, we will reach out to you personally to discuss a suitable replacement or a refund. We value your choice and never send substitutes without your approval."
    },
    {
      question: "Why does the weight of fresh items vary?",
      answer: "Nature produces unique sizes! For items like whole chicken or large fruits, the final weight may vary by +/- 5%. Your final bill will always be updated to reflect the exact weight delivered, ensuring you only pay for what you receive."
    },
    {
      question: "How do you handle delivery in gated communities?",
      answer: "Our executives are happy to deliver to your doorstep or the security gate, depending on your society's rules. If access is restricted by security, we will call you to arrange the most convenient handover."
    },
    {
      question: "What if I am not available to receive my order?",
      answer: "We understand plans change! If we can't reach you after 3 attempts and a 5-minute wait, we will return the items to the hub to maintain freshness. A subsequent re-delivery will incur a small ₹29 fee."
    },
    {
      question: "What is your policy on staff conduct and safety?",
      answer: "We treat our delivery partners as part of the RG Basket family. We kindly ask our customers to maintain a respectful environment during deliveries to help us continue providing great service."
    },
    {
      question: "Can I use multiple promo codes with different accounts?",
      answer: "To ensure as many families as possible can benefit from our welcome offers, promo codes and new-user discounts are limited to one per household. Duplicate registrations for the same address may result in order cancellations."
    },
    {
      question: "Why does the product I received look slightly different from the photo?",
      answer: "The beauty of natural produce is that no two items are identical! Since we source directly from harvests, seasonal variations in shape and color are normal. We guarantee the quality remains premium regardless of appearance."
    },
    {
      question: "Is there a limit on how much I can buy?",
      answer: "To ensure fresh supplies are fairly distributed across Cuttack, we may occasionally limit the quantity of high-demand staples (like milk or onions) per customer during peak seasons."
    },
    {
      question: "What if there is a wrong price on the website?",
      answer: "If an item is accidentally listed with an obvious technical error in pricing (e.g., ₹0), we reserve the right to cancel the order and provide a full refund. We appreciate your understanding in such rare technical cases."
    },
    {
      question: "Will my delivery be late during heavy rain or festivals?",
      answer: "We brave most weather, but during extreme rain, floods, or major Cuttack festivals (like Baliyatra), safety comes first. We will keep you updated on any unavoidable delays that might occur."
    },
    {
      question: "Are there any health or safety warnings for your products?",
      answer: "We recommend washing all fresh produce before use and following standard cooking practices for meat. If you have severe life-threatening allergies, please consult with us before ordering as our facility handles diverse products."
    },
    {
      question: "Will I receive updates on WhatsApp or SMS?",
      answer: "Yes, we keep you in the loop! By ordering, you'll receive important transactional updates via WhatsApp, SMS, and Email. You can manage your preferences for promotional messages at any time."
    },
    {
      question: "What is your safety and anti-tampering policy?",
      answer: "We deliver in sealed packaging for your peace of mind. If you notice the seal or bag is compromised at the time of delivery, please do not accept it. We'll arrange a fresh delivery for you immediately."
    },
    {
      question: "When does the delivery timer start?",
      answer: "Our goal is efficiency! The estimated delivery window begins once your order is confirmed on the app. We appreciate your patience during peak hours or network-related processing delays."
    },
    {
      question: "Can I return an item if I changed my mind?",
      answer: "Due to the perishable nature of fresh food and our lightning-fast delivery cycle, we cannot accept returns for mind-changes or accidental orders after they have been accepted at the doorstep."
    },
    {
      question: "Can I add items to my order after checkout?",
      answer: "To ensure your order reaches you as fast as possible, our packing team starts working immediately. If you need more items, please place a separate new order."
    },
    {
      question: "What is your policy on missing items or quality complaints?",
      answer: "To help us resolve issues quickly, please report any missing or quality concerns within 6 hours. Providing clear photos of the product and its original packaging helps our team verify and fix the issue promptly."
    },
    {
      question: "How do you handle high-value orders?",
      answer: "For your security, we recommend checking high-value orders (above ₹1000) carefully at the time of delivery. Our executive will wait for you to verify the items before completing the handover."
    },
    {
      question: "What is your Fair Usage Policy for refunds?",
      answer: "We strive to be fair to everyone. We monitor for unusual patterns in refund requests; accounts with exceptionally high claim rates may undergo a review to ensure the integrity of our service."
    },
    {
      question: "What if my GPS location doesn't match my address?",
      answer: "Please ensure your delivery pin is accurate to help our drivers find you quickly. Orders placed with intentionally incorrect locations outside our service area may be cancelled to maintain our service standards."
    },
    {
      question: "Is RG Basket environmentally friendly?",
      answer: "Absolutely! We love Cuttack and Odisha. We use 100% recyclable or reusable packaging to minimize our environmental footprint."
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

        {/* FAQ Accordion Section */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-5 text-left flex justify-between items-center hover:bg-green-50/50 transition-colors"
              >
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-1">
                    {index + 1}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 leading-tight">
                    {faq.question}
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  className="ml-4 text-green-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.span>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 ml-9 border-t border-gray-50 pt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-green-50 border border-green-200 rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Need More Help?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-center">
            <div className="p-4 bg-white/50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">📞 Call Us</h3>
              <p className="text-gray-700">+91-6370810878, 9556137807</p>
              <p className="text-sm text-gray-600">Available 7:00 AM - 10:00 PM</p>
            </div>
            <div className="p-4 bg-white/50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">✉️ Email Us</h3>
              <p className="text-gray-700">rgbasketbusiness@gmail.com</p>
              <p className="text-sm text-gray-600">Response within 2 hours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingReturns;
