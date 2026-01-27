import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaShieldAlt } from 'react-icons/fa';

const BanScreen = ({ user }) => {
    const handleWhatsappSupport = () => {
        const message = `Hello RG Basket Support, my account with email ${user?.email} has been banned. I would like to request unbanning.`;
        const whatsappUrl = `https://wa.me/919078771530?text=${encodeURIComponent(message)}`; // RG Basket Business WhatsApp
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[999999] bg-white flex items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaShieldAlt className="text-red-500 text-5xl" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Access Restricted</h1>
                <p className="text-gray-600 mb-8">
                    Your account has been temporarily restricted from placing orders due to policy violations.
                </p>

                <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 underline decoration-red-200">User Details:</h3>
                    <p className="text-sm text-gray-600"><span className="font-bold">Name:</span> {user?.name}</p>
                    <p className="text-sm text-gray-600"><span className="font-bold">Email:</span> {user?.email}</p>
                    {user?.isBanned && user?.banReason && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-red-50 rounded border border-red-100">
                            <span className="font-bold text-red-700">Reason:</span> {user.banReason}
                        </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 font-medium">Status: <span className="text-red-600 font-bold uppercase tracking-widest">Restricted</span></p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleWhatsappSupport}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-100 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                        <FaWhatsapp size={24} />
                        Contact Support via WhatsApp
                    </button>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        🥲
                    </button>
                </div>

                <p className="mt-12 text-xs text-gray-400">
                    If you believe this is a mistake, our support team is available 24/7 to review your appeal.
                </p>
            </motion.div>
        </div>
    );
};

export default BanScreen;
