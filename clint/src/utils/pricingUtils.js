/**
 * pricingUtils.js
 * Centralized utility for dynamic day-wise pricing in RG Basket.
 * Supports day-specific rates (e.g., lower fish market prices on Sunday, Wednesday, Friday).
 */

export const DAYS_OF_WEEK = [
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' }
];

const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current day of week (lowercase: 'sunday', 'monday', etc.) in IST timezone,
 * or calculate it from a given date string (e.g. '2026-09-06').
 */
export const getDayOfWeekFromDate = (dateInput = null) => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  if (!dateInput) {
    // Current day in IST
    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
    return dayNames[nowIST.getDay()];
  }

  // If already a day name string
  if (typeof dateInput === 'string' && dayNames.includes(dateInput.toLowerCase())) {
    return dateInput.toLowerCase();
  }

  // If Date object
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dayNames[dateInput.getDay()];
  }

  // If YYYY-MM-DD string
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return dayNames[d.getDay()];
      }
    }
  }

  // Fallback to today in IST
  const fallback = new Date(new Date().toLocaleString('en-US', { timeZone: IST_TIMEZONE }));
  return dayNames[fallback.getDay()];
};

/**
 * Resolves the effective price (Normal Price & Offer Price) for a product variant on a given day.
 * 
 * @param {Object} variant - Product weight variant ({ price, offerPrice, dailyPrices })
 * @param {string|Date} dayInput - Day of week name ('sunday') or date string ('2026-09-06')
 * @returns {Object} { price, offerPrice, basePrice, baseOfferPrice, discount, isSpecialDayPrice, dayKey, dayName }
 */
export const getEffectivePrice = (variant, dayInput = null) => {
  if (!variant) {
    return {
      price: 0,
      offerPrice: 0,
      basePrice: 0,
      baseOfferPrice: 0,
      discount: 0,
      isSpecialDayPrice: false,
      dayKey: 'sunday',
      dayName: 'Sunday'
    };
  }

  const dayKey = getDayOfWeekFromDate(dayInput);
  const dayName = dayKey ? dayKey.charAt(0).toUpperCase() + dayKey.slice(1) : '';

  const basePrice = Number(variant.price) || 0;
  const baseOfferPrice = Number(variant.offerPrice) || basePrice;

  // Check if this variant has a specific price for dayKey
  const dayOverride = variant.dailyPrices?.[dayKey];
  const hasOverrideOfferPrice = dayOverride && 
    dayOverride.offerPrice !== undefined && 
    dayOverride.offerPrice !== null && 
    dayOverride.offerPrice !== '' &&
    Number(dayOverride.offerPrice) > 0;

  let effectiveOfferPrice = baseOfferPrice;
  let effectivePrice = basePrice;
  let isSpecialDayPrice = false;

  if (hasOverrideOfferPrice) {
    effectiveOfferPrice = Number(dayOverride.offerPrice);
    isSpecialDayPrice = true;

    if (dayOverride.price !== undefined && dayOverride.price !== null && dayOverride.price !== '' && Number(dayOverride.price) > 0) {
      effectivePrice = Number(dayOverride.price);
    } else {
      // Fall back to base MRP, ensuring it's at least as high as the offer price
      effectivePrice = Math.max(basePrice, effectiveOfferPrice);
    }
  }

  const discount = Math.max(0, effectivePrice - effectiveOfferPrice);

  return {
    price: effectivePrice,
    offerPrice: effectiveOfferPrice,
    basePrice,
    baseOfferPrice,
    discount,
    isSpecialDayPrice,
    dayKey,
    dayName
  };
};

/**
 * Checks if a product or variant has any day-wise pricing overrides configured.
 */
export const hasDayWisePricing = (productOrVariant) => {
  if (!productOrVariant) return false;

  // Check if product-level flag is true
  if (productOrVariant.hasDayWisePricing) return true;

  // If it's a product with weights array
  if (Array.isArray(productOrVariant.weights)) {
    return productOrVariant.weights.some(w => hasDayWisePricing(w));
  }

  // If it's a variant with dailyPrices object
  if (productOrVariant.dailyPrices && typeof productOrVariant.dailyPrices === 'object') {
    return DAYS_OF_WEEK.some(({ key }) => {
      const dp = productOrVariant.dailyPrices[key];
      return dp && dp.offerPrice !== undefined && dp.offerPrice !== null && dp.offerPrice !== '' && Number(dp.offerPrice) > 0;
    });
  }

  return false;
};

/**
 * Generates the full 7-day pricing schedule for a variant.
 */
export const getWeeklyPricingSchedule = (variant, currentDayInput = null) => {
  if (!variant) return [];

  const currentDayKey = getDayOfWeekFromDate(currentDayInput);
  const basePrice = Number(variant.price) || 0;
  const baseOfferPrice = Number(variant.offerPrice) || basePrice;

  return DAYS_OF_WEEK.map(day => {
    const effective = getEffectivePrice(variant, day.key);
    const isOverridden = effective.isSpecialDayPrice;
    const savingsVsBase = isOverridden ? Math.round(baseOfferPrice - effective.offerPrice) : 0;

    return {
      key: day.key,
      label: day.label,
      short: day.short,
      offerPrice: effective.offerPrice,
      price: effective.price,
      isOverridden,
      isCurrentDay: day.key === currentDayKey,
      savingsVsBase
    };
  });
};
