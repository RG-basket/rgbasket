import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerReviews = () => {
  const [currentReview, setCurrentReview] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Realistic pre-launch reviews from Cuttack locals
// Realistic & Heartwarming Pre-Launch Reviews from Cuttack Locals
const reviews = [
  {
    id: 1,
    name: "Mama (Local Aunty)",
    location: "Buxi Bazaar",
    rating: 5,
    comment:
      "Finally! Cuttack ku ek genuine grocery delivery service milila. Subah subah fresh sabji milile life set heija! Aame nijara market jiba darkar nahi — perfect for busy mornings!",
    role: "Homemaker",
    expectation: "Morning fresh vegetables"
  },
  {
    id: 2,
    name: "Bapi (Working Professional)",
    location: "Chandinchowk",
    rating: 4,
    comment:
      "Office se wapas aane ke baad market jaana mushkil hai yaar. Agar aap evening delivery slot rakh do, toh bahut convenient hoga. Support local vendors bhi kar rahe ho — nice initiative!",
    role: "IT Professional",
    expectation: "Evening delivery after work"
  },
  {
    id: 3,
    name: "Didi (College Student)",
    location: "Ravenshaw Campus Area",
    rating: 5,
    comment:
      "Hostel re sabji kiniba pain market bahut dur. Ei service asile humara pain perfect! Small packs, budget friendly — exactly what students need!",
    role: "Student",
    expectation: "Small quantity packs"
  },
  {
    id: 4,
    name: "Kaku (Local Shop Owner)",
    location: "Chhatra Bazar",
    rating: 4,
    comment:
      "Ame dukaan pain fresh maal darkar. Bulk delivery option hele local shopwale bhi faida uthai paribe! Local supply chain ko strong karuchha — proud of this idea!",
    role: "Shopkeeper",
    expectation: "Bulk orders for shop"
  },
  {
    id: 5,
    name: "Sona Bhai (Delivery Rider)",
    location: "Jobra",
    rating: 5,
    comment:
      "Cutteck re aji sab digital hei jauchi! Ei app thile sab log convenience paibe – gharaku sabji, fruits sab milijiba time re! Aur hamare jaise delivery boys ko bhi rozgaar mil raha hai 🙌",
    role: "Delivery Partner",
    expectation: "On-time service for everyone"
  },
  {
    id: 6,
    name: "Tutu (College Boy)",
    location: "College Square",
    rating: 4,
    comment:
      "Muje lagta hai agar snacks aur cold drinks bhi mil jaye, to hostel night full paisa vasool hojaega! 😂 But seriously, super helpful for students living away from home!",
    role: "Student",
    expectation: "Snacks and late-night delivery"
  },
  {
    id: 7,
    name: "Lata Mami (Retired Teacher)",
    location: "Badambadi",
    rating: 5,
    comment:
      "Mo ghara re mu ekla re rahuchi. Ei service sahajare mu fresh fruits & milk order kari paruchi bina bahare jiba. Bahut help karuchha apana mane — especially senior citizens pain. 🙏",
    role: "Retired Teacher",
    expectation: "Easy access for elderly"
  },
  {
    id: 8,
    name: "Raju Bhai (Auto Driver)",
    location: "Mangalabag",
    rating: 5,
    comment:
      "Bhala lagila dekhi je local boys eha start karichhanti. Local logon ku kama miluchhi, time bachi jauchi, sabu fresh. Ei type service re Cuttack grow heba 💪",
    role: "Auto Driver",
    expectation: "Affordable daily essentials"
  },
  {
    id: 9,
    name: "Pinki (Working Mom)",
    location: "College Square",
    rating: 5,
    comment:
      "Office aur ghar dono sambhalna tough hai. Ei grocery delivery app bahut relief deichi. Time save hela, stress bhi kam! Cutteck ra ladies pain blessing jaisa hai 💖",
    role: "Working Mom",
    expectation: "Fast & reliable delivery"
  },
  {
    id: 10,
    name: "Rahul (NGO Volunteer)",
    location: "Tulsipur",
    rating: 5,
    comment:
      "Loved that they also tie-up with local farmers. Helping small growers sell directly — that’s impact! Sustainability aur local economy dono ka win-win model hai 👏",
    role: "Volunteer",
    expectation: "Support for local farmers"
  }
];


  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Auto-rotate reviews on mobile
  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(nextReview, 5000);
      return () => clearInterval(interval);
    }
  }, [isMobile]);

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 ${index < rating 
                ? "text-[#2e8b57] fill-[#2e8b57]" 
                : "text-gray-300 fill-gray-300"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-green-50/50 to-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-8 sm:mb-12 px-2"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Cuttack is <span className="text-[#2e8b57]">Excited!</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Here's what our fellow Cuttack residents are saying about RGBasket before we even launch!
          </p>
        </motion.div>

        {/* Main Review Card */}
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            key={currentReview}
            initial={{ opacity: 0, x: isMobile ? 0 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 0 : -50 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-green-100/50 p-4 sm:p-6 md:p-8 lg:p-10 mx-2"
          >
            {/* Quote Icon - Hidden on smallest screens */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 text-green-100">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
              </svg>
            </div>

            <div className="relative z-10 ml-0 sm:ml-2">
              {/* Rating */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <StarRating rating={reviews[currentReview].rating} />
                <span className="text-xs sm:text-sm text-gray-500 bg-green-50 px-2 sm:px-3 py-1 rounded-full w-fit">
                  {reviews[currentReview].role}
                </span>
              </div>

              {/* Review Text */}
              <blockquote className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-800 leading-relaxed sm:leading-loose mb-4 sm:mb-6 md:mb-8 font-medium">
                "{reviews[currentReview].comment}"
              </blockquote>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#2e8b57] to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                  {reviews[currentReview].name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                      {reviews[currentReview].name}
                    </h4>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></span>
                  </div>
                  <p className="text-green-600 font-medium text-xs sm:text-sm md:text-base truncate">
                    {reviews[currentReview].location}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                    Expecting: {reviews[currentReview].expectation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Arrows - Show on desktop, hide on mobile */}
          {!isMobile && (
            <>
              <button
                onClick={prevReview}
                className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white border border-green-200 rounded-full flex items-center justify-center text-[#2e8b57] hover:bg-green-50 transition-all shadow-lg active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextReview}
                className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white border border-green-200 rounded-full flex items-center justify-center text-[#2e8b57] hover:bg-green-50 transition-all shadow-lg active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Dots Indicator - Enhanced for mobile */}
          <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`transition-all duration-300 ${
                  index === currentReview 
                    ? 'bg-[#2e8b57] w-6 sm:w-8 h-2 sm:h-3 rounded-full' 
                    : 'bg-green-200 hover:bg-green-300 w-2 h-2 sm:w-3 sm:h-3 rounded-full'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile Swipe Instructions */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mt-4"
            >
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <span>Swipe or tap dots to navigate</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;