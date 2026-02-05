import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: `By accessing and using RG Basket ("the Platform"), you accept and agree to be bound by these Terms of Service. 
      If you do not agree to these terms, please do not use our services. These terms apply to all visitors, users, and others 
      who access or use the Platform.`
    },
    {
      title: "Account Registration",
      content: `To access certain features, you must register for an account. You agree to provide accurate, current, and 
      complete information during registration. You are responsible for safeguarding your account credentials and for all 
      activities that occur under your account. You must notify us immediately of any unauthorized use of your account.`
    },
    {
      title: "Ordering and Payment",
      content: `All orders are subject to product availability and delivery area restrictions. Prices are subject to change 
      without notice. We accept various payment methods as displayed during checkout. For cash on delivery orders, payment 
      is collected at the time of delivery. We reserve the right to refuse or cancel any order for any reason.`
    },
    {
      title: "Delivery Services",
      content: `We strive to deliver orders within the selected time slots. However, delivery times are estimates and not 
      guaranteed. We are not liable for delays due to unforeseen circumstances. You must provide accurate delivery address 
      and ensure someone is available to receive the order. Failed deliveries may result in additional charges.`
    },
    {
      title: "Product Quality and Returns",
      content: `We ensure the quality and freshness of all products. If you receive damaged, defective, or incorrect items, 
      you must report it within 6 hours of delivery. Returns are subject to our Return Policy. Fresh produce quality may vary 
      based on season and availability. We reserve the right to substitute products with similar quality items when necessary.`
    },
    {
      title: "User Conduct",
      content: `You agree not to: Use the Platform for any illegal purpose; harass, abuse, or harm others; interfere with 
      the Platform's operation; attempt to gain unauthorized access; use automated systems to access the Platform; or engage 
      in any fraudulent activities. Violation may result in account termination.`
    },
    {
      title: "Intellectual Property",
      content: `All content on the Platform, including text, graphics, logos, images, and software, is the property of RG Basket 
      or its licensors and is protected by intellectual property laws. You may not use, reproduce, modify, or distribute any 
      content without our express written permission.`
    },
    {
      title: "Limitation of Liability",
      content: `To the maximum extent permitted by law, RG Basket shall not be liable for any indirect, incidental, special, 
      consequential, or punitive damages resulting from your use or inability to use the Platform. Our total liability shall 
      not exceed the amount you paid for the services in the past six months.`
    },
    {
      title: "Termination",
      content: `We may terminate or suspend your account and access to the Platform immediately, without prior notice, for 
      conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason 
      with 30 days notice.`
    },
    {
      title: "Governing Law",
      content: `These Terms shall be governed by and construed in accordance with the laws of India, without regard to its 
      conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bhubaneswar, Odisha.`
    },
    {
      title: "Changes to Terms",
      content: `We reserve the right to modify these Terms at any time. We will notify users of significant changes through 
      email or platform notifications. Continued use of the Platform after changes constitutes acceptance of the new Terms.`
    },
    {
      title: "Contact Information",
      content: `For questions about these Terms of Service, please contact us at:
      Email: rgbasketbusiness@gmail.com
      Phone: +91-6370810878, 9556137807
      Address: RG Basket, Bhubaneswar, Odisha, India`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-600 mt-2">
            Please read these terms carefully before using our services.
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-600 text-xl">⚠️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-yellow-800">Important Notice</h3>
              <p className="text-yellow-700 mt-1">
                By accessing or using RG Basket, you agree to be bound by these Terms of Service.
                If you disagree with any part of these terms, you may not access our services.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start mb-4">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                    {index + 1}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                <p className="text-gray-700 leading-relaxed ml-12">
                  {section.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agreement Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-purple-50 border border-purple-200 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Agreement
          </h2>
          <p className="text-gray-700 text-center mb-6">
            By using RG Basket, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              For questions or concerns about these terms, contact our legal team at{' '}
              <a href="mailto:rgbasketbusiness@gmail.com" className="text-purple-600 hover:text-purple-700 font-medium">
                rgbasketbusiness@gmail.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;