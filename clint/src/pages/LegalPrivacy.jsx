import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4 py-20"
        >
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

            <div className="prose prose-emerald max-w-none text-gray-600 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold text-gray-800">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us when you create an account, place an order, or contact us. This includes your name, email address, phone number, and delivery address.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800">2. How We Use Your Information</h2>
                    <p>We use the information we collect to process your orders, provide customer support, and send you updates about your delivery. We do not sell your personal data to third parties.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800">3. Google Data</h2>
                    <p>If you login using your Google account, we only access your basic profile information (name, email, and profile photo) to create and manage your account on RG Basket.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800">4. Data Security</h2>
                    <p>We implement industry-standard security measures to protect your personal information from unauthorized access or disclosure.</p>
                </section>

                <p className="text-sm pt-8 border-t font-medium text-emerald-700">Last updated: February 2026</p>
            </div>
        </motion.div>
    );
};

export default PrivacyPolicy;
