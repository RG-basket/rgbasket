import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiInfo } from 'react-icons/fi';
import { Capacitor } from '@capacitor/core';

const NotificationPrompt = ({ onEnable }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('default');

    useEffect(() => {
        const checkStatus = async () => {
            if (Capacitor.isNativePlatform()) {
                return;
            }

            if ('Notification' in window) {
                setPermissionStatus(Notification.permission);

                // Show on every visit until the user grants permission
                if (Notification.permission !== 'granted') {
                    const timer = setTimeout(() => setIsVisible(true), 3000);
                    return () => clearTimeout(timer);
                }
            }
        };
        checkStatus();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    const handleEnable = async () => {
        if (permissionStatus === 'denied') {
            alert('Notifications are blocked by your browser. Please enable them in your browser settings to receive updates.');
            return;
        }
        
        const result = await onEnable();
        if (result === 'granted') {
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[999] bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden"
            >
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <FiBell size={24} className="animate-bounce" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-gray-800 leading-tight">Don't miss out!</h3>
                                <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
                                    <FiX size={20} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Get instant updates on your orders and exclusive flash sales.
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleEnable}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-100"
                        >
                            Enable Notifications
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2.5 text-gray-400 hover:text-gray-600 font-medium text-sm"
                        >
                            Later
                        </button>
                    </div>

                    {permissionStatus === 'denied' && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg">
                            <FiInfo size={12} />
                            <span>Notifications are blocked. Reset permissions in browser settings.</span>
                        </div>
                    )}
                </div>
                <div className="h-1 w-full bg-emerald-600/10">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 10, ease: 'linear' }}
                        className="h-full bg-emerald-600"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NotificationPrompt;
