import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Smartphone, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        {
            title: "Information We Collect",
            icon: <Eye className="w-6 h-6 text-emerald-600" />,
            content: "We collect personal information that you provide to us, such as your name, delivery address, phone number, and email. We also collect usage data (IP address, browser type) to improve our service experience."
        },
        {
            title: "How We Use Your Data",
            icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
            content: "Your data is primarily used to process orders, manage your account, and provide customer support. We may send transactional updates via WhatsApp or SMS to keep you informed about your delivery status."
        },
        {
            title: "Data Security",
            icon: <Lock className="w-6 h-6 text-emerald-600" />,
            content: "We implement robust security measures including SSL encryption to protect your data. We do not store your credit card or payment information on our servers; all payments are processed through secure third-party gateways like Razorpay."
        },
        {
            title: "Third-Party Sharing",
            icon: <Globe className="w-6 h-6 text-emerald-600" />,
            content: "We do not sell or rent your personal information. We only share necessary data with trusted delivery partners to fulfill your orders and with payment processors to handle transactions."
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-emerald-900/5 border border-emerald-100"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <Shield className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Privacy Policy</h1>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-12 font-medium bg-emerald-50/50 p-6 rounded-2xl border-l-4 border-emerald-500">
                        At RG Basket, we value your trust and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our platform.
                    </p>

                    <div className="grid gap-10">
                        {sections.map((section, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative pl-8"
                            >
                                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-100 rounded-full" />
                                <div className="flex items-center gap-3 mb-3">
                                    {section.icon}
                                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                                </div>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    {section.content}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 pt-8 border-t border-gray-100 italic text-sm text-gray-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Last updated: March 2026
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
