import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "Information We Collect",
      content: [
        "Personal Information: Name, email address, phone number, delivery address, and payment information when you create an account or place an order.",
        "Usage Data: IP address, browser type, device information, pages visited, and time spent on our platform.",
        "Location Data: Delivery location and approximate location based on IP address for service availability.",
        "Transaction Data: Order history, purchase preferences, and payment details."
      ]
    },
    {
      title: "How We Use Your Information",
      content: [
        "Order Processing: To process and deliver your orders, send order confirmations, and provide customer support.",
        "Service Improvement: To enhance user experience, develop new features, and improve our services.",
        "Communication: To send transactional messages, order updates, and promotional offers (with your consent).",
        "Security: To detect and prevent fraud, unauthorized activities, and security breaches.",
        "Personalization: To provide personalized recommendations and content based on your preferences."
      ]
    },
    {
      title: "Information Sharing",
      content: [
        "Service Providers: We share necessary information with delivery partners, payment processors, and cloud service providers to fulfill your orders.",
        "Legal Requirements: We may disclose information when required by law, court order, or government request.",
        "Business Transfers: In case of merger, acquisition, or sale of assets, user information may be transferred.",
        "With Your Consent: We share information with third parties only when you explicitly consent."
      ]
    },
    {
      title: "Data Security",
      content: [
        "We implement industry-standard security measures including SSL encryption, secure servers, and regular security audits.",
        "Payment information is processed through PCI-DSS compliant payment gateways. We don't store your credit card details.",
        "Access to personal information is restricted to authorized personnel who need it to perform their job functions.",
        "We regularly update our security practices and conduct vulnerability assessments."
      ]
    },
    {
      title: "Data Retention",
      content: [
        "We retain your personal information for as long as necessary to provide our services and fulfill legal obligations.",
        "Order information is retained for 7 years for tax and accounting purposes.",
        "Account information is retained until you request deletion or the account becomes inactive for 3 years.",
        "You can request data deletion at any time by contacting our support team."
      ]
    },
    {
      title: "Your Rights",
      content: [
        "Access: You can request a copy of your personal data we hold.",
        "Correction: You can update or correct your personal information in your account settings.",
        "Deletion: You can request deletion of your personal data, subject to legal requirements.",
        "Opt-out: You can opt-out of marketing communications at any time.",
        "Data Portability: You can request your data in a machine-readable format."
      ]
    },
    {
      title: "Cookies and Tracking",
      content: [
        "We use cookies and similar technologies to enhance user experience, analyze trends, and administer the platform.",
        "Essential cookies are necessary for the website to function and cannot be switched off.",
        "Analytics cookies help us understand how users interact with our platform.",
        "You can control cookie preferences through your browser settings."
      ]
    },
    {
      title: "Third-Party Services",
      content: [
        "Our platform may contain links to third-party websites with their own privacy policies.",
        "We use Google Analytics for website analytics and performance monitoring.",
        "Payment processing is handled by secure third-party payment gateways.",
        "We're not responsible for the privacy practices of third-party services."
      ]
    },
    {
      title: "Children's Privacy",
      content: [
        "Our services are not directed to individuals under 13 years of age.",
        "We do not knowingly collect personal information from children under 13.",
        "If we become aware that we have collected personal information from a child under 13, we will delete it immediately.",
        "Parents or guardians can contact us to review or delete their child's information."
      ]
    },
    {
      title: "Policy Updates",
      content: [
        "We may update this privacy policy from time to time to reflect changes in our practices or legal requirements.",
        "We will notify you of significant changes through email or platform notifications.",
        "Continued use of our services after changes constitutes acceptance of the updated policy.",
        "We encourage you to review this policy periodically for updates."
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <p className="text-gray-600 mt-2">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            At RG Basket, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our 
            platform and services. By accessing or using RG Basket, you agree to the terms of this Privacy Policy.
          </p>
        </motion.div>

        {/* Policy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Contact Us
          </h2>
          <p className="text-gray-700 text-center mb-6">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-center">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📧 Email</h3>
              <p className="text-gray-700">privacy@rgbasket.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📞 Phone</h3>
              <p className="text-gray-700">+91-6370810878</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center mt-6">
            Data Protection Officer: RG Basket Privacy Team
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;