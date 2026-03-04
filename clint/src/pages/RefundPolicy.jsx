import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, XCircle, CreditCard, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const RefundPolicy = () => {
    const sections = [
        {
            title: "Cancellation Policy",
            icon: <XCircle className="w-6 h-6 text-red-500" />,
            content: "Orders can be cancelled at any time before they are marked as 'Out for Delivery'. Once the delivery partner has dispatched the order from our hub, cancellations are not permitted. You can cancel your order directly from the 'My Orders' section in the app/website.",
            bg: "bg-red-50/50"
        },
        {
            title: "Return Policy",
            icon: <RefreshCcw className="w-6 h-6 text-blue-500" />,
            content: "We offer a 24-hour return policy for non-perishable goods and an immediate 'at-door' return policy for fresh produce (Fruits, Vegetables, Meat). If you are unhappy with the quality of fresh items, please return them to the delivery executive immediately after inspection.",
            bg: "bg-blue-50/50"
        },
        {
            title: "Refund Process",
            icon: <CreditCard className="w-6 h-6 text-emerald-500" />,
            content: "Once a return or cancellation is approved, refunds are processed within 24-48 business hours. For Prepaid orders, the amount will be credited back to the original payment method (Bank/UPI/Wallet), which may take 5-7 working days to reflect in your account.",
            bg: "bg-emerald-50/50"
        },
        {
            title: "Non-Returnable Items",
            icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
            content: "Items that have been opened, consumed partially, or damaged due to improper storage at the customer's end are not eligible for returns. Personal care and hygiene products are also non-returnable once the seal is broken.",
            bg: "bg-orange-50/50"
        }
    ];

    return (
        <div className="min-h-screen bg-white py-16 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl font-black text-gray-900 mb-4">Refund & Cancellation</h1>
                    <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full" />
                    <p className="mt-6 text-gray-600 font-medium">Clear, fair, and transparent policies for your peace of mind.</p>
                </motion.div>

                <div className="grid gap-8">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`${section.bg} rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    {section.icon}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                            </div>
                            <p className="text-gray-700 leading-relaxed font-medium pl-2 border-l-4 border-gray-200 ml-6">
                                {section.content}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 p-8 bg-gray-900 rounded-3xl text-white text-center">
                    <h3 className="text-xl font-bold mb-4">Need help with a return?</h3>
                    <p className="text-gray-400 mb-6">Our support team is available from 7:00 AM to 10:00 PM</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="mailto:rgbasketbusiness@gmail.com" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-colors">Email Support</a>
                        <a href="https://wa.me/919078771530" className="px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors">WhatsApp Us</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
