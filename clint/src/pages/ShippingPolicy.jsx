import React from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, ShieldCheck, Box, Info } from 'lucide-react';

const ShippingPolicy = () => {
    const details = [
        {
            icon: <MapPin className="text-emerald-600" />,
            title: "Delivery Areas",
            content: "We currently provide exclusive delivery services within Cuttack City limits and immediate peripheral areas. We are rapidly expanding to other cities in Odisha. You can verify your location's eligibility by entering your pincode on the home page."
        },
        {
            icon: <Clock className="text-emerald-600" />,
            title: "Delivery Timelines",
            content: "We offer multiple daily delivery slots (Morning: 7AM-10AM, Noon: 12PM-3PM, Evening: 5PM-8PM). For 'Quick Commerce' tagged items, we aim to deliver within 60-90 minutes from order confirmation."
        },
        {
            icon: <Truck className="text-emerald-600" />,
            title: "Shipping Charges",
            content: "A nominal delivery fee of ₹29 applies to standard orders. Free delivery is available for orders above ₹499 in specific zones. Exact delivery charges will be calculated and displayed on the checkout page before payment."
        },
        {
            icon: <Box className="text-emerald-600" />,
            title: "Packaging & Safety",
            content: "All items are packed in eco-friendly, sanitized bags. Fresh meats and dairy are transported in temperature-controlled containers to maintain maximum freshness and hygiene until they reach your doorstep."
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
                    <h1 className="text-4xl font-black text-gray-900 mb-4">Shipping & Delivery</h1>
                    <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full" />
                    <p className="mt-6 text-gray-600 font-medium">How we bring the farm-fresh goodness to your doorstep.</p>
                </motion.div>

                <div className="space-y-6">
                    {details.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col md:flex-row gap-6 p-8 rounded-3xl bg-emerald-50/30 border border-emerald-100/50"
                        >
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                                {React.cloneElement(item.icon, { size: 28 })}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h2>
                                <p className="text-gray-600 leading-relaxed font-medium">
                                    {item.content}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-12 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4"
                >
                    <Info className="text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-800 leading-relaxed font-medium">
                        <strong>Note:</strong> Delivery times may be affected during heavy rains, local festivals (like Baliyatra), or public holidays. We will keep you updated via WhatsApp/SMS in case of any unavoidable delays.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default ShippingPolicy;
