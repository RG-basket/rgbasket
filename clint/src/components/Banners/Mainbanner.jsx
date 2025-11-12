import React from 'react';
import mainBanner from '../../assets/spikes-ripe-wheat-farmers-field-ai-generated-image.avif';

const MainBanner = () => {
  return (
    <section className="px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group aspect-[7/2]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={mainBanner}
            alt="Ripe wheat field with spikes"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 to-transparent"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Logo */}
          <div className="mb-1 sm:mb-2 md:mb-4 transform transition-all duration-500 group-hover:scale-105">
            <div className="text-base sm:text-xl md:text-3xl lg:text-5xl font-bold tracking-tight drop-shadow-2xl animate-float">
              <span className="bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">
                RG Basket
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-xs sm:text-sm md:text-lg lg:text-2xl font-medium mb-2 sm:mb-3 md:mb-4 tracking-tight drop-shadow-2xl leading-snug px-1 max-w-[90%] sm:max-w-[80%] lg:max-w-[70%] break-words">
            Pick your{' '}
            <span className="bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent font-bold">
              Slot
            </span>
            , we pick your{' '}
            <span className="font-bold text-emerald-200">
              Grocery
            </span>
          </h1>

          {/* CTA Button */}
          <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-1 px-3 sm:py-1.5 sm:px-5 md:py-2 md:px-6 lg:py-2.5 lg:px-8 rounded-full shadow-xl transform transition duration-300 hover:scale-105 active:scale-95 border border-emerald-400/30 text-[0.6rem] sm:text-xs md:text-sm lg:text-base max-w-full overflow-hidden">
            Shop Now
          </button>

          {/* Tagline */}
          <div className="mt-1 sm:mt-2 md:mt-3 flex items-center space-x-1 sm:space-x-2 text-[0.55rem] sm:text-[0.65rem] md:text-sm text-emerald-100 max-w-full overflow-hidden">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="truncate">Fresh • Organic • Delivered</span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 opacity-20">
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 border border-emerald-300 rounded-full animate-ping"></div>
        </div>
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-20">
          <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border border-amber-300 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Floating Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default MainBanner;