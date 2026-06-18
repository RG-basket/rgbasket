import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerReviews = () => {
  const [currentReview, setCurrentReview] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Reset expansion when switching reviews
  useEffect(() => {
    setIsExpanded(false);
  }, [currentReview]);

  // Realistic pre-launch reviews from Cuttack locals
// Realistic & Heartwarming Pre-Launch Reviews from Cuttack Locals
// Real Google Maps Reviews from Cuttack Customers
const reviews = [
  {
    id: 1,
    name: "Pujarani Sahoo",
    role: "Local Guide",
    location: "Google Maps Review",
    rating: 5,
    date: "21 weeks ago",
    comment:
      "Recently I was going through my Instagram reels then I got to know about there services. I thought let's order as they are claiming that they provide fresh from the market itself. To be honest what they claim about, it's exact the same. Let me tell you one more thing they have the best service as well, I'll tell you why I didn't recognise that there was missing something in my order, because it's almost 15 items, later they themselves called and told me mam we had missed one thing, and we will deliver it, and along with that I told them to bring kakharufula as I wasn't able to find anywhere,where in as per my request they fulfilled that smoothly without even calling them. And it's a hassle to go to a vegetable market, and source everything that to this fresh. So I would say if you don't feel like going to the crowd for the vegetable shopping, it's better to order from them as they're the genuine ones and sticks to the promise that they claim because I've also ordered from other platforms it's not that fresh. So yeah good job guys.",
    reply: "Thank you so much for your kind words! Hearing that we could make your day a little easier—and find those kakharufula—truly motivates us. We are always happy to help!",
    replyDate: "21 weeks ago"
  },
  {
    id: 2,
    name: "Abhinandita Swain",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "14 weeks ago",
    comment: "The fabulous thing is behaviour of their delivery boys are The Best and I'm very happy for the fresh things that I got",
    reply: "Thank you so much 🙌",
    replyDate: "14 weeks ago"
  },
  {
    id: 3,
    name: "Subhasmita Nanda",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "17 weeks ago",
    comment: "Yes as per there commitment i RCVD fresh vegetables, fruits and fish in time. Very good service. Thank you.",
    reply: "Thanks a lot! 😃 It was a pleasure serving you. We’ll be ready with fresh stock whenever you need us next. Have a great week ahead! 🍗🥦",
    replyDate: "17 weeks ago"
  },
  {
    id: 4,
    name: "Sanu",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "19 weeks ago",
    comment: "Great experience!!! You get fresh non veg items, vegetables, fruits right at your doorstep.",
    reply: "We're so happy to hear this! It's honestly our privilege to bring fresh quality right to your door. We’re incredibly grateful for your support and can’t wait to pack your next order",
    replyDate: "19 weeks ago"
  },
  {
    id: 5,
    name: "Arshad Ul Iman",
    role: "Local Guide",
    location: "Google Maps Review",
    rating: 5,
    date: "21 weeks ago",
    comment: "Best Experience had with you guys. They literally got us a skip the travel time to market. One Stop All Veg, Non Veg, Fruits and what not !!!!",
    reply: "This truly made our day! 🥹 Thank you so much for such a beautiful and encouraging review. ❤️",
    replyDate: "21 weeks ago"
  },
  {
    id: 6,
    name: "Arttatrana panda",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "16 weeks ago",
    comment: "Excellent in all counts",
    reply: "We truly appreciate your kind words! It’s customers like you who motivate us to keep delivering the best quality groceries in town. Thank you for choosing RG Basket",
    replyDate: "16 weeks ago"
  },
  {
    id: 7,
    name: "Smita Panda",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "11 weeks ago",
    comment: "Fresh vegetables",
    reply: "Thank you so much mam for the review 🙌",
    replyDate: "11 weeks ago"
  },
  {
    id: 8,
    name: "Arshad Ul Iman",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "21 weeks ago",
    comment: "Excellent, Accurate, Responsive and Trustable Service they offer which is the experience I had on my recent orders...",
    reply: "This truly made our day! 🥹 Thank you so much for such a beautiful and encouraging review. ❤️",
    replyDate: "21 weeks ago"
  },
  {
    id: 9,
    name: "Kill Deal",
    role: "Local Reviewer",
    location: "Google Maps Review",
    rating: 5,
    date: "27 weeks ago",
    comment: "Thanks for the fresh chicken man 😁",
    reply: "🙏 Thank You for Your Review! Hi there, we are so glad you loved the fresh chicken! We look forward to serving you again. 😊",
    replyDate: "27 weeks ago"
  }
];


  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Auto-rotate reviews on mobile (pause if user has expanded a long review)
  useEffect(() => {
    if (isMobile && !isExpanded) {
      const interval = setInterval(nextReview, 6000);
      return () => clearInterval(interval);
    }
  }, [isMobile, isExpanded]);

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

  const currentComment = reviews[currentReview]?.comment || "";
  const shouldTruncate = currentComment.length > 200;
  const displayText = shouldTruncate && !isExpanded 
    ? currentComment.slice(0, 200) + "..." 
    : currentComment;

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
            What Cuttack is <span className="text-[#2e8b57]">Saying!</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Real reviews from our lovely customers on Google Maps about their shopping experience with RG Basket.
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
                "{displayText}"
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-2 text-xs sm:text-sm font-extrabold text-[#2e8b57] hover:text-[#1e5c38] transition-colors focus:outline-none inline-flex items-center gap-0.5 align-middle border border-green-200/50 bg-green-50/50 px-2.5 py-0.5 rounded-lg shadow-sm active:scale-95"
                  >
                    {isExpanded ? "Show Less" : "Read More"}
                  </button>
                )}
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

                </div>
              </div>

              {/* Owner's Reply */}
              {reviews[currentReview].reply && (
                <div className="mt-6 p-4 bg-green-50/60 rounded-2xl border border-green-100/50 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-[#2e8b57] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      RG
                    </div>
                    <span className="font-bold text-gray-900">RG Basket (Owner)</span>
                  </div>
                  <p className="text-gray-700 italic ml-8">
                    "{reviews[currentReview].reply}"
                  </p>
                </div>
              )}
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