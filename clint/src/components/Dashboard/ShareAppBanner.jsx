import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load icons
const Share2 = lazy(() => import('lucide-react').then(module => ({ default: module.Share2 })));
const Heart = lazy(() => import('lucide-react').then(module => ({ default: module.Heart })));
const MessageCircle = lazy(() => import('lucide-react').then(module => ({ default: module.MessageCircle })));

// Skeleton components
const IconSkeleton = () => (
  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
);

const ButtonSkeleton = () => (
  <div className="px-3 py-2 bg-gray-200 rounded-lg animate-pulse w-20 h-9" />
);

const ShareAppBanner = () => {
  const [showShare, setShowShare] = useState(false);
  const [emoji, setEmoji] = useState('👋');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = "Check out RGBasket! 🛒 Fresh groceries at insane prices. Your go-to for veggies, fruits, meats & more!";

  // Initialize component after mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Rotate emojis when idle - optimized with requestAnimationFrame
  useEffect(() => {
    if (!isLoaded || isSupported) return;

    let animationFrameId;
    let lastUpdate = 0;
    const emojis = ['👋', '🤔', '👀', '💭', '🛒', '🚚'];
    let currentIndex = 0;

    const updateEmoji = (timestamp) => {
      if (!lastUpdate) lastUpdate = timestamp;
      const elapsed = timestamp - lastUpdate;

      if (elapsed > 2000) {
        currentIndex = (currentIndex + 1) % emojis.length;
        setEmoji(emojis[currentIndex]);
        lastUpdate = timestamp;
      }

      if (!isSupported) {
        animationFrameId = requestAnimationFrame(updateEmoji);
      }
    };

    animationFrameId = requestAnimationFrame(updateEmoji);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isSupported, isLoaded]);

  const handleShare = async () => {
    if (!isLoaded) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'RGBasket', text: shareText, url: appUrl });
        handleSupport();
      } catch (error) {
        // Silent fail for cancelled shares
      }
    } else {
      setShowShare(true);
    }
  };

  const handleSupport = () => {
    if (!isLoaded) return;
    setIsSupported(true);
    setEmoji('❤️');
  };

  const shareActions = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + appUrl)}`, '_blank');
        setShowShare(false);
        handleSupport();
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Share2,
      label: 'Copy Link',
      action: async () => {
        try {
          await navigator.clipboard.writeText(appUrl);
          setShowShare(false);
          handleSupport();
        } catch (error) {
          // Fallback for clipboard
          const textArea = document.createElement('textarea');
          textArea.value = appUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setShowShare(false);
          handleSupport();
        }
      },
      color: 'bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600'
    }
  ];

  // Skeleton loader
  if (!isLoaded) {
    return (
      <div className="w-full bg-gradient-to-r from-emerald-50 via-lime-50 to-white border-b border-emerald-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ButtonSkeleton />
            <ButtonSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Banner - Always Visible */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-gradient-to-r from-emerald-50 via-lime-50 to-white border-b border-emerald-200 px-4 py-3 relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
          {/* Message & Emoji */}
          <div className="flex items-center gap-3 flex-1">
            <motion.span 
              animate={{ 
                scale: isSupported ? [1, 1.3, 1] : [1, 1.1, 1],
                rotate: isSupported ? [0, 10, -10, 0] : 0
              }}
              transition={{ duration: isSupported ? 0.6 : 2, repeat: isSupported ? 0 : Infinity }}
              className="text-2xl"
            >
              {emoji}
            </motion.span>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isSupported ? (
                  <>Thanks for supporting <span className="text-pink-500">RGBasket</span>! 💝</>
                ) : (
                  <>Love <span className="text-emerald-600">RGBasket</span>? Help us grow!</>
                )}
              </p>
              <p className="text-xs text-gray-600 hidden sm:block">
                {isSupported 
                  ? "You're awesome! Share with more friends 🚀" 
                  : "Share with friends who'd love fresh, affordable groceries 🛒"
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.span
              whileHover={!isSupported ? { scale: 1.05 } : {}}
              whileTap={!isSupported ? { scale: 0.95 } : {}}
              onClick={handleSupport}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-semibold transition-all ${
                isSupported 
                  ? 'bg-pink-500 border-pink-500 text-white cursor-default' 
                  : 'bg-white border-lime-300 text-lime-700 hover:bg-lime-50'
              }`}
            >
              <Suspense fallback={<IconSkeleton />}>
                <motion.div
                  animate={isSupported ? { scale: [1, 1.5, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Heart size={16} fill={isSupported ? "currentColor" : "none"} />
                </motion.div>
              </Suspense>
              <span className="hidden sm:inline">
                {isSupported ? 'Supported!' : 'Support'}
              </span>
            </motion.span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isSupported
                  ? 'bg-pink-400 text-white hover:bg-pink-500'
                  : 'bg-gradient-to-r from-emerald-500 to-lime-500 text-white hover:shadow-lg'
              }`}
            >
              <Suspense fallback={<IconSkeleton />}>
                <Share2 size={16} />
              </Suspense>
              <span className="hidden sm:inline">Share</span>
            </motion.button>
          </div>
        </div>

        {/* Optimized Background Animation */}
        <motion.div
          animate={{ x: [0, 100, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-20 h-20 bg-emerald-200/30 rounded-full blur-xl -translate-y-10"
          style={{ willChange: 'transform' }}
        />
        <motion.div
          animate={{ x: [0, -80, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: 1 }}
          className="absolute bottom-0 right-0 w-24 h-24 bg-lime-200/30 rounded-full blur-xl translate-y-8"
          style={{ willChange: 'transform' }}
        />
      </motion.div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowShare(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Share the Love! 💫</h3>
                  <p className="text-sm text-gray-600 mt-1">Help friends discover RGBasket</p>
                </div>

                <div className="space-y-3">
                  {shareActions.map((item, index) => (
                    <motion.button
                      key={item.label}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 p-3 text-white rounded-xl font-semibold transition-all ${item.color}`}
                    >
                      <Suspense fallback={<IconSkeleton />}>
                        <item.icon size={20} />
                      </Suspense>
                      <span>Share via {item.label}</span>
                    </motion.button>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-center text-gray-500 mt-4"
                >
                  Every share helps us serve more fresh groceries! 🌱
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareAppBanner;