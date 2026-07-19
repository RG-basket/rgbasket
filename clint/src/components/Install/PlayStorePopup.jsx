import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useAppContext } from '../../context/AppContext';

const PlayStorePopup = () => {
    const { isAppReady } = useAppContext();
    const [showPopup, setShowPopup] = useState(false);

    // Configuration: Show popup again after 3 days if dismissed
    const REMINDER_DAYS = 1;
    const COOLDOWN_PERIOD = REMINDER_DAYS * 24 * 60 * 60 * 1000;
    const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.rgbasket.app&pcampaignid=web_share";

    useEffect(() => {
        // Show popup only if the main loader/app is ready
        if (!isAppReady) return;

        let timer;

        const checkDeviceAndCooldown = () => {
            const searchParams = new URLSearchParams(window.location.search);
            // Robust check: scan hash parameters too in case router appends it after the hash
            const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
            const hashParams = new URLSearchParams(hashQuery);
            const isTest = searchParams.has('testPlayStore') || hashParams.has('testPlayStore');

            const isNative = Capacitor.isNativePlatform();
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const isAndroid = /Android/i.test(userAgent);
            
            // 🛑 DO NOT SHOW ON NATIVE APK: Exit immediately if running in Capacitor (Android/iOS app)
            if (isNative && !isTest) {
                return;
            }

            // We target Android users specifically since this is a Play Store app.
            if (!isAndroid && !isTest) {
                return;
            }

            const lastDismissed = localStorage.getItem('playStorePopupDismissedAt');
            const isSessionDismissed = sessionStorage.getItem('playStorePopupDismissedSession');
            const now = Date.now();
            const timeSinceDismissed = lastDismissed ? now - parseInt(lastDismissed) : null;
            const isCooldownActive = lastDismissed && (timeSinceDismissed < COOLDOWN_PERIOD);

            if (isTest || (!isCooldownActive && !isSessionDismissed)) {
                // Introduce a subtle 3-second delay after loading screen for superior UX
                timer = setTimeout(() => {
                    setShowPopup(true);
                }, 3000);
            }
        };

        checkDeviceAndCooldown();

        // FLAWLESS CLEANUP: Cancel the timer on component unmount/re-render
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isAppReady]);

    const handleRedirect = () => {
        // Store current timestamp for the 1-day local storage cooldown check
        localStorage.setItem('playStorePopupDismissedAt', Date.now().toString());
        setShowPopup(false);
        window.open(PLAYSTORE_URL, '_blank', 'noopener,noreferrer');
    };

    const handleDismiss = () => {
        // Store in sessionStorage to hide it for this active browsing session
        sessionStorage.setItem('playStorePopupDismissedSession', 'true');
        setShowPopup(false);
    };

    return (
        <AnimatePresence>
            {showPopup && (
                <motion.div
                    className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center px-0 sm:px-4 bg-black/60 backdrop-blur-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Background click dismiss */}
                    <div className="absolute inset-0" onClick={handleDismiss} />

                    <motion.div
                        className="bg-slate-50/95 backdrop-blur-md rounded-t-3xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-full sm:max-w-md p-8 relative border border-slate-200/60 flex flex-col items-center text-center overflow-hidden z-10"
                        initial={{ y: '100%', opacity: 0.5 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0.5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        {/* Pull bar indicator on mobile */}
                        <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mb-6 sm:hidden" />

                        {/* Top close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-slate-400 hover:text-[var(--brand-dark)] transition-colors p-1.5 rounded-full hover:bg-slate-200/40 cursor-pointer"
                            aria-label="Close popup"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Beautiful Text Logo Section */}
                        <div className="flex items-center justify-center gap-0.5 mb-6 text-3.5xl tracking-tight select-none">
                            <span className="font-extrabold text-black">RG</span>
                            <span className="font-black text-[var(--brand-dark)]">Basket</span>
                        </div>

                        {/* Title and Description */}
                        <h2 className="text-2xl font-black text-slate-800 mt-2 mb-2 tracking-tight">
                            Get the official App!
                        </h2>
                        <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">
                            Enjoy <span className="font-semibold text-[var(--brand-dark)]">faster checkout</span>, <span className="font-semibold text-[var(--brand-dark)]">exclusive offers</span>, and <span className="font-semibold text-[var(--brand-dark)]">real-time delivery updates</span>.
                        </p>

                        {/* Google Play Store Badge Button */}
                        <button
                            onClick={handleRedirect}
                            className="bg-zinc-950 hover:bg-zinc-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-97 w-full max-w-xs justify-center cursor-pointer border border-zinc-900 shadow-md"
                        >
                            {/* Official-looking Google Play SVG */}
                            <svg viewBox="134 307.5 32 32" className="w-8 h-8 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(.181794 0 0 .181794 111.21426 251.37762)">
                                    <linearGradient y2="434.291" x2="100.359" y1="319.454" x1="215.196" gradientUnits="userSpaceOnUse" id="A">
                                        <stop offset="0" stopColor="#00a0ff"/>
                                        <stop offset=".007" stopColor="#00a1ff"/>
                                        <stop offset=".26" stopColor="#00beff"/>
                                        <stop offset=".512" stopColor="#00d2ff"/>
                                        <stop offset=".76" stopColor="#00dfff"/>
                                        <stop offset="1" stopColor="#00e3ff"/>
                                    </linearGradient>
                                    <path d="M137.5 311.5c-2 2.1-3.2 5.4-3.2 9.6v151.3c0 4.2 1.2 7.5 3.2 9.6l.5.5 84.8-84.8v-2L138 310.9z" fill="url(#A)"/>
                                    <linearGradient y2="396.75" x2="132.007" y1="396.75" x1="297.578" gradientUnits="userSpaceOnUse" id="B">
                                        <stop offset="0" stopColor="#ffe000"/>
                                        <stop offset=".409" stopColor="#ffbd00"/>
                                        <stop offset=".775" stopColor="orange"/>
                                        <stop offset="1" stopColor="#ff9c00"/>
                                    </linearGradient>
                                    <path d="M251 426l-28.2-28.3v-2l28.3-28.3.6.4 33.5 19c9.6 5.4 9.6 14.3 0 19.8l-33.5 19z" fill="url(#B)"/>
                                    <linearGradient y2="568.208" x2="80.242" y1="412.481" x1="235.969" gradientUnits="userSpaceOnUse" id="C">
                                        <stop offset="0" stopColor="#ff3a44"/>
                                        <stop offset="1" stopColor="#c31162"/>
                                    </linearGradient>
                                    <path d="M251.7 425.6l-28.9-28.9-85.3 85.3c3.1 3.3 8.4 3.8 14.2.4l100-56.8" fill="url(#C)"/>
                                    <linearGradient y2="330.609" x2="185.559" y1="261.07" x1="116.02" gradientUnits="userSpaceOnUse" id="D">
                                        <stop offset="0" stopColor="#32a071"/>
                                        <stop offset=".069" stopColor="#2da771"/>
                                        <stop offset=".476" stopColor="#15cf74"/>
                                        <stop offset=".801" stopColor="#06e775"/>
                                        <stop offset="1" stopColor="#00f076"/>
                                    </linearGradient>
                                    <path d="M251.7 367.9l-100-56.8c-5.9-3.3-11.1-2.9-14.2.4l85.3 85.3z" fill="url(#D)"/>
                                    <path d="M251 425l-99.3 56.4c-5.6 3.2-10.5 3-13.7.1l-.5.5.5.5c3.2 2.9 8.2 3.1 13.7-.1l100-56.8z" opacity=".2"/>
                                    <path d="M137.5 481c-2-2.1-3.2-5.4-3.2-9.6v1c0 4.2 1.2 7.5 3.2 9.6l.5-.5zm147.6-75.4L251 425l.6.6 33.5-19c4.8-2.7 7.2-6.3 7.2-9.9-.4 3.3-2.8 6.4-7.2 8.9z" opacity=".12"/>
                                    <path d="M151.7 312l133.4 75.8c4.3 2.5 6.8 5.6 7.2 8.9 0-3.6-2.4-7.2-7.2-9.9L151.7 311c-9.6-5.4-17.4-.9-17.4 10v1c0-10.9 7.8-15.4 17.4-10z" opacity=".25" fill="#fff"/>
                                </g>
                            </svg>
                            
                            <div className="text-left flex flex-col justify-center leading-tight">
                                <span className="text-[10px] tracking-wider text-zinc-400 font-semibold uppercase">GET IT ON</span>
                                <span className="text-base font-bold tracking-tight text-white">Google Play</span>
                            </div>
                        </button>

                        {/* Dismiss link */}
                        <button
                            onClick={handleDismiss}
                            className="mt-5 text-xs font-bold text-slate-400 hover:text-[var(--brand-dark)] transition-colors py-1.5 cursor-pointer hover:underline"
                        >
                            Continue to Mobile Website
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PlayStorePopup;
