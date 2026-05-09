import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Smartphone, Globe, Trash2 } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        {
            title: "Information We Collect",
            icon: <Eye className="w-6 h-6 text-emerald-600" />,
            content: "We collect personal data you provide (Name, Phone, Email, Delivery Address). When you use our APK, we also collect Device Information (OS version, unique device identifiers) and Location Data (precise GPS) to ensure accurate grocery delivery and service availability in your area."
        },
        {
            title: "Why We Collect This Data",
            icon: <Shield className="w-6 h-6 text-emerald-600" />,
            content: "Location data is necessary to determine if we can deliver to your area. Device IDs are used to send you personalized Push Notifications (via Firebase) about your order status. Your contact info is used strictly for authentication and order-related communication."
        },
        {
            title: "Third-Party Services",
            icon: <Globe className="w-6 h-6 text-emerald-600" />,
            content: "We use Google Auth for secure logins and Firebase for push notifications and analytics. We do not sell your data. We only share delivery details with our verified riders and payment details with secure processors like Razorpay."
        },
        {
            title: "Information for Delivery Partners",
            icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
            content: "We collect government-issued identification (Aadhar Card, Driving License) and vehicle documentation from our delivery partners. This information is used strictly for identity verification, safety, and background checks. This data is stored on secure, encrypted servers and is never shared with third parties."
        },
        {
            title: "Data Security & Storage",
            icon: <Lock className="w-6 h-6 text-emerald-600" />,
            content: "Your data is encrypted using SSL/TLS protocols. We store your profile information on secure MongoDB Atlas servers. We do not store sensitive payment credentials; these are handled entirely by PCI-DSS compliant partners."
        },
        {
            title: "Account & Data Deletion",
            icon: <Trash2 className="w-6 h-6 text-red-600" />,
            content: "You have the total right to delete your account. You can do this in the App under 'Profile > Delete Account'. This action permanently erases your personal data, order history, and RG Coins from our active databases within 30 days."
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

                    <div className="mt-12 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                        <Shield className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-red-950 mb-1">Data Privacy Requests</h3>
                            <p className="text-sm text-red-800 font-medium leading-relaxed">
                                For any questions regarding your data or to request manual deletion of your personal information, please email us at <a href="mailto:rgbasketbusiness@gmail.com" className="font-black underline">rgbasketbusiness@gmail.com</a>. We will respond within 48 hours.
                            </p>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-gray-100 italic text-sm text-gray-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Last updated: May 2026
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
