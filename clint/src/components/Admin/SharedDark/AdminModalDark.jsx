import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { tw } from '../../../config/tokyoNightTheme';

const AdminModalDark = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-full mx-4'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full ${sizes[size]} ${tw.bgSecondary} rounded-2xl shadow-2xl overflow-hidden border ${tw.borderPrimary} flex flex-col max-h-[90vh]`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${tw.borderPrimary}`}>
                        <h2 className={`text-xl font-bold ${tw.textPrimary}`}>{title}</h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg ${tw.hoverElevated} ${tw.textSecondary} hover:text-[#f7768e] transition-colors`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className={`p-6 border-t ${tw.borderPrimary} ${tw.bgInput}`}>
                            {footer}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AdminModalDark;
