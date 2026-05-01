import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { FaCoins } from 'react-icons/fa';

// Lazy load icons
const Share2 = lazy(() => import('lucide-react').then(module => ({ default: module.Share2 })));
const MessageCircle = lazy(() => import('lucide-react').then(module => ({ default: module.MessageCircle })));

// Skeleton components
const IconSkeleton = () => (
  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" />
);

const ButtonSkeleton = () => (
  <div className="px-3 py-2 bg-gray-200 rounded-lg animate-pulse w-20 h-9" />
);

const ShareAppBanner = () => {
  const { user, rewardSettings } = useAppContext();
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [emoji, setEmoji] = useState('🎁');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Helper to get fresh, attractive share data at the moment of action
  const getShareData = () => {
    const code = user?.referralCode || '';
    const url = window.location.origin + (code ? `?ref=${code}` : '');
    const text = code 
      ? `Hey! Get fresh veggies, fruits & meat at the best prices on RG Basket! 🛒🍇🐟🐔🍅 Use my Invite Code: ( ${code} ) to unlock your JOINING BONUS! 🎁✨ Grab the deal now:`
      : "Check out RG Basket! 🛒 Fresh groceries at insane prices. Your go-to for veggies, fruits, meats & more! Get it here:";
    return { url, text };
  };

  const referralReward = rewardSettings?.referralRewardCoins || 500;

  // Initialize component after mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Rotate emojis when idle
  useEffect(() => {
    if (!isLoaded || isSupported) return;

    let animationFrameId;
    let lastUpdate = 0;
    const emojis = ['🎁', '🪙', '✨', '🤝', '🛒', '🚚'];
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
    const { url, text } = getShareData();

    if (navigator.share) {
      try {
        await navigator.share({ 
            title: 'RG Basket Referral', 
            text: text, 
            url: url 
        });
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
    setEmoji('✅');
  };

  const shareActions = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      action: () => {
        const { url, text } = getShareData();
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        setShowShare(false);
        handleSupport();
      },
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Share2,
      label: 'Copy Link',
      action: async () => {
        const { url } = getShareData();
        try {
          await navigator.clipboard.writeText(url);
          setShowShare(false);
          handleSupport();
        } catch (error) {
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setShowShare(false);
          handleSupport();
        }
      },
      color: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
    }
  ];

  if (!isLoaded) {
    return (
      <div className="w-full bg-amber-50 border-b border-amber-100 px-4 py-3 md:py-6">
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-amber-200 rounded-full animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-3 bg-amber-200 rounded animate-pulse w-3/4" />
              <div className="h-2 bg-amber-100 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full bg-amber-50/90 border-b border-amber-200/50 px-4 py-1.5 md:py-6 relative overflow-hidden backdrop-blur-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-amber-200/40 rounded-full blur-2xl md:blur-3xl -mr-16 -mt-16" />
        <div className="absolute inset-0 pointer-events-none hidden md:block">
            <motion.div animate={{ opacity: [0.1, 0.4, 0.1], y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-4 left-1/4 text-xl">✨</motion.div>
            <motion.div animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute top-10 right-1/4 text-2xl">🪙</motion.div>
            <motion.div animate={{ opacity: [0.1, 0.4, 0.1], x: [0, 20, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 2 }} className="absolute bottom-4 left-1/3 text-lg">✨</motion.div>
        </div>

        <div className="flex items-center justify-between gap-1 max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-2 md:gap-5 min-w-0 flex-1">
            <motion.div 
              animate={{ boxShadow: ["0 0 0 0px rgba(251,191,36,0)", "0 0 0 10px rgba(251,191,36,0.1)", "0 0 0 0px rgba(251,191,36,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex-shrink-0 w-8 h-8 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg ring-1 md:ring-4 ring-amber-100 relative overflow-hidden"
            >
              <span className="text-[9px] md:text-2xl font-black drop-shadow-md relative z-10 uppercase">RG</span>
              <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }} className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
            </motion.div>
            <div className="min-w-0">
              <h4 className="text-[10px] md:text-2xl font-black text-amber-900 leading-none uppercase md:normal-case tracking-tighter truncate">
                {isSupported ? "Link Shared! ✅" : `Refer & Earn ${referralReward} Coins`}
              </h4>
              <p className="text-[7px] md:text-sm font-black md:font-medium text-orange-600/80 md:text-gray-500 uppercase md:normal-case tracking-widest md:tracking-normal leading-none mt-0.5 md:mt-1.5 truncate">
                {isSupported ? "Reward after friend's 1st order 🎁" : "Click Invite & Earn ✨"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile', { state: { openRules: true } })}
              className="px-1.5 md:px-6 py-1 md:py-3 bg-white text-amber-800 rounded-lg md:rounded-2xl text-[7.5px] md:text-sm font-black uppercase tracking-widest border border-amber-200 active:scale-95 transition-all shadow-sm"
            >
              Rules
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex items-center gap-1 md:gap-3 px-1.5 md:px-8 py-1 md:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg md:rounded-2xl text-[7.5px] md:text-sm font-black uppercase tracking-widest shadow-xl shadow-amber-200 active:scale-95 transition-all border border-amber-400"
            >
              <Suspense fallback={<IconSkeleton />}>
                <Share2 className="w-2.5 h-2.5 md:w-5 md:h-5" strokeWidth={3} />
              </Suspense>
              <span>Invite</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
              onClick={() => setShowShare(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-amber-100"
            >
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-inner animate-bounce">
                    <FaCoins size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Spread the Word 🪙</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">Earn {referralReward} Coins per friend ✨</p>
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
                      className={`w-full flex items-center justify-center gap-3 p-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${item.color}`}
                    >
                      <Suspense fallback={<IconSkeleton />}>
                        <item.icon size={18} strokeWidth={3} />
                      </Suspense>
                      <span>{item.label}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                    Coins added automatically <br/>
                    after successful order 🪙✨
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareAppBanner;
