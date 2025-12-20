import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';

const BannerCarousel = ({ fallbackBanner }) => {
    const { API_URL } = useAppContext();
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBanners = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/banners`);
            if (response.data.success && response.data.banners.length > 0) {
                setBanners(response.data.banners);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, [banners.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }, [banners.length]);

    useEffect(() => {
        if (banners.length <= 1 || isPaused) return;

        const currentBanner = banners[currentIndex];
        const duration = currentBanner.duration || 5000;

        const timer = setInterval(nextSlide, duration);
        return () => clearInterval(timer);
    }, [banners, currentIndex, isPaused, nextSlide]);

    // Swipe handlers
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) nextSlide();
        if (isRightSwipe) prevSlide();
    };

    if (isLoading) {
        return (
            <div className="px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6">
                <div className="w-full aspect-[21/9] bg-gray-200 animate-pulse rounded-2xl shadow-lg border border-gray-100" />
            </div>
        );
    }

    if (banners.length === 0) {
        return fallbackBanner;
    }

    const activeBanner = banners[currentIndex];

    return (
        <section
            className="px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group aspect-[21/9]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeBanner._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                        className={`absolute inset-0 ${activeBanner.linkUrl ? 'cursor-pointer' : ''}`}
                        onClick={() => activeBanner.linkUrl && (window.location.href = activeBanner.linkUrl)}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src={activeBanner.imageUrl}
                                alt={activeBanner.altText || 'Banner'}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"></div>
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>

                        {/* Content overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4 sm:px-6 md:px-8">
                            {activeBanner.title ? (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="mb-1 sm:mb-2 md:mb-4"
                                >
                                    <h2 className="text-sm sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight drop-shadow-2xl">
                                        <span className="bg-gradient-to-r from-amber-200 to-emerald-200 bg-clip-text text-transparent">
                                            {activeBanner.title}
                                        </span>
                                    </h2>
                                </motion.div>
                            ) : null}

                            {activeBanner.subtitle ? (
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="text-[0.6rem] sm:text-xs md:text-lg lg:text-2xl font-medium mb-2 sm:mb-3 md:mb-4 tracking-tight drop-shadow-xl max-w-[90%] sm:max-w-[80%] break-words"
                                >
                                    {activeBanner.subtitle}
                                </motion.p>
                            ) : null}

                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Controls */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/10 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:bg-black/20 border border-white/10"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/10 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center hover:bg-black/20 border border-white/10"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {/* Dot Indicators */}
                        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 sm:space-x-2">
                            {banners.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`transition-all duration-300 ${idx === currentIndex
                                        ? 'w-4 h-1.5 sm:w-6 sm:h-2 bg-emerald-400 rounded-full'
                                        : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 hover:bg-white/60 rounded-full'
                                        }`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default BannerCarousel;
