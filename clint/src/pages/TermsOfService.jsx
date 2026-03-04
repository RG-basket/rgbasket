import React from 'react';
import { motion } from 'framer-motion';
import { FileText, UserCheck, CreditCard, Truck, Scale, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
  const sections = [
    {
      title: "Nature of Service",
      icon: <Scale className="w-6 h-6" />,
      content: "RG Basket is an online grocery platform connecting farmers directly to consumers in Odisha. By using our services, you agree to comply with all local laws and the rules set forth in this document."
    },
    {
      title: "Account Responsibilities",
      icon: <UserCheck className="w-6 h-6" />,
      content: "You are responsible for maintaining the confidentiality of your account details. Any activity performed through your account is your legal responsibility. You must provide accurate delivery information to ensure timely service."
    },
    {
      title: "Ordering & Pricing",
      icon: <CreditCard className="w-6 h-6" />,
      content: "Product prices are subject to change based on market daily harvests. We reserve the right to cancel orders in case of pricing errors or product unavailability. Payments can be made via UPI, Cards, or COD."
    },
    {
      title: "Product Quality",
      icon: <AlertCircle className="w-6 h-6" />,
      content: "As we deal with perishable fresh produce, the weight and appearance may vary slightly. We guarantee freshness at the time of delivery. Please inspect all fresh items at the doorstep."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-emerald-600 p-10 text-white text-center">
            <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4 backdrop-blur-md">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">Terms of Service</h1>
            <p className="text-emerald-50/80 font-medium">Please read these terms carefully before using RG Basket.</p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            <div className="prose max-w-none text-gray-600 font-medium leading-relaxed">
              By accessing or using the RG Basket website or mobile application, you agree to be bound by these Terms of Service. If you disagree with any part, you may not access our services.
            </div>

            <div className="grid gap-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h2>
                    <p className="text-gray-600 leading-relaxed font-medium">{section.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 bg-orange-50/50 p-6 rounded-3xl border border-orange-100 flex gap-4">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-800 font-medium italic">
                Note: For specific policies regarding delivery and returns, please refer to our Shipping Policy and Refund & Cancellation pages linked in the footer.
              </p>
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 font-medium tracking-wider">RG BASKET LEGAL • LAST UPDATED MARCH 2026</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;