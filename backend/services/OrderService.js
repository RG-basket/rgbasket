const Order = require('../models/Order');
const Product = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const ServiceArea = require('../models/ServiceArea');
const Offer = require('../models/Offer');
const TelegramService = require('./TelegramService');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const CoinService = require('./CoinService');

class OrderService {
  /**
   * Create a new order with inventory validation and pricing calculation
   */
  async createOrder(orderData, userId) {
    let validatedItems = [];
    try {
      // 1. INPUT SANITIZATION & USER AUTH CHECK
      const checkUserId = userId || orderData.user || orderData.userId;
      if (!checkUserId) throw new AppError('Authentication required to place order', 401);

      // --- SECURITY GUARD: ENFORCE EXCLUSIVITY RULE ---
      // We check if the user is trying to stack multiple rewards in one request.
      let activeRewardsCount = 0;
      if (orderData.promoCode) activeRewardsCount++;
      if (orderData.useCoins === true || orderData.useCoins === 'true') activeRewardsCount++;
      if (orderData.selectedGift) activeRewardsCount++;

      if (activeRewardsCount > 1) {
        throw new AppError('Reward stacking detected. You can only use one: Promo Code, RG Coins, or a Free Gift.', 400);
      }

      // Sanitize delivery instructions to prevent XSS/Injection
      const instruction = orderData.instruction
        ? orderData.instruction.toString().replace(/[<>]/g, '').slice(0, 1000)
        : "";

      console.log('🛒 OrderService receiving data. User:', checkUserId);
      // Validate products and inventory
      const validationResult = await this.validateOrderItems(orderData.items);
      validatedItems = validationResult.validatedItems;
      const subtotal = validationResult.subtotal;

      // Validate slot availability (both category-date and product-day)
      await this.validateSlotAvailability(orderData.items, orderData.deliveryDate, orderData.timeSlot);

      // Validate and apply promo code
      let discountAmount = 0;
      let promoCodeDoc = null;

      if (orderData.promoCode) {
        promoCodeDoc = await PromoCode.findOne({
          code: orderData.promoCode.toUpperCase(),
          isActive: true
        });

        if (!promoCodeDoc) {
          throw new AppError('Invalid or inactive promo code', 400);
        }

        console.log(`[OrderService] Validating promo ${promoCodeDoc.code} for user ${checkUserId}`);

        // Check if user has already used this code
        const hasUsed = promoCodeDoc.usedBy.some(usage => {
          const usedId = usage.user && usage.user._id ? usage.user._id.toString() : usage.user.toString();
          return usedId === checkUserId.toString();
        });

        if (hasUsed) {
          throw new AppError('You have already used this promo code', 400);
        }

        // Calculate discount on subtotal
        discountAmount = promoCodeDoc.calculateDiscount(subtotal);
      }

      // 1.5. RG Coin System - Redemption & Debt Recovery Logic
      let coinsUsed = 0;
      let coinDiscountInRs = 0;
      let coinDebtRecoveryInRs = 0;

      const user = await User.findOne({
        $or: [
          { _id: checkUserId.match(/^[0-9a-fA-F]{24}$/) ? checkUserId : null },
          { googleId: checkUserId }
        ].filter(q => q._id !== null || q.googleId !== undefined)
      });

      if (user) {
        const conversionRate = await CoinService.getConfig('conversionRate', 10);

        // CASE A: User has Debt (Negative Coins)
        if (user.rgCoins < 0) {
          coinDebtRecoveryInRs = Math.abs(user.rgCoins) / conversionRate;
          console.log(`[OrderService] User ${checkUserId} has debt. Surcharge of ₹${coinDebtRecoveryInRs} added.`);
        }

        // CASE B: User wants to Redeem (Positive Coins)
        if (orderData.useCoins && user.rgCoins > 0) {
          const maxRedemptionRupees = await CoinService.getConfig('maxRedemptionRupees', 30);
          const minOrderForRedemption = await CoinService.getConfig('minOrderForRedemption', 0);

          const pincode = orderData.shippingAddress?.pincode;
          let shippingFee = 29;
          let freeDeliveryThreshold = 299;
          if (pincode) {
            const serviceArea = await ServiceArea.findOne({ pincode, isActive: true });
            if (serviceArea) {
              shippingFee = serviceArea.deliveryCharge !== undefined ? serviceArea.deliveryCharge : 29;
              freeDeliveryThreshold = serviceArea.minOrderForFreeDelivery !== undefined ? serviceArea.minOrderForFreeDelivery : 299;
            }
          }
          const finalShippingFee = (subtotal > 0 && (subtotal - discountAmount) < freeDeliveryThreshold) ? shippingFee : 0;
          const tipAmount = Math.max(0, Number(orderData.tipAmount) || 0);
          const totalBeforeCoins = subtotal + finalShippingFee + tipAmount - discountAmount;

          if (totalBeforeCoins >= minOrderForRedemption) {
            const maxCoinsByAdmin = maxRedemptionRupees * conversionRate;
            const maxCoinsByCartTotal = Math.floor(Math.max(0, totalBeforeCoins) * conversionRate);
            const absoluteMaxCoins = Math.min(user.rgCoins, maxCoinsByAdmin, maxCoinsByCartTotal);

            const requestedCoins = Number(orderData.coinsUsed);
            coinsUsed = (!isNaN(requestedCoins) && requestedCoins > 0)
              ? Math.min(absoluteMaxCoins, requestedCoins)
              : absoluteMaxCoins;

            coinDiscountInRs = coinsUsed / conversionRate;
          }
        }
      }

      // Calculate pricing
      const pincode = orderData.shippingAddress?.pincode;
      const tipAmount = Math.max(0, Number(orderData.tipAmount) || 0);
      const pricing = await this.calculatePricing(subtotal, 0, discountAmount, pincode, tipAmount, coinDiscountInRs, coinDebtRecoveryInRs);

      // Validate Free Gift (Anti-Cheat)
      let finalSelectedGift = orderData.selectedGift;
      if (finalSelectedGift) {
        // Fetch valid offers for this subtotal
        const validOffers = await Offer.find({
          isActive: true,
          minOrderValue: { $lte: pricing.subtotal }
        });

        const allValidGifts = validOffers.flatMap(o => o.options);

        if (!allValidGifts.includes(finalSelectedGift)) {
          finalSelectedGift = null; // Strip the gift if they didn't earn it
        }
      }

      // 3. ATOMIC STOCK LOCKING
      const stockUpdated = await this.updateProductInventory(validatedItems, 'decrement');
      if (!stockUpdated) {
        throw new AppError('One or more items became out of stock during checkout.', 400);
      }

      // 4. ATOMIC PROMO LOCKING
      let promoAppliedSuccessfully = false;
      if (promoCodeDoc) {
        try {
          await PromoCode.registerUsageAtomic(
            promoCodeDoc._id,
            checkUserId,
            "PENDING_" + Date.now(),
            pricing.discount
          );
          promoAppliedSuccessfully = true;
        } catch (err) {
          await this.updateProductInventory(validatedItems, 'increment');
          throw new AppError('Promo code could not be applied.', 400);
        }
      }

      // 5. LOCATION RESOLUTION
      let liveLocation = null;
      let deliveryLocation = null;
      const incomingLoc = orderData.location;
      if (incomingLoc) {
        const coords = incomingLoc.coordinates || { latitude: incomingLoc.latitude, longitude: incomingLoc.longitude };
        if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
          liveLocation = {
            coordinates: { latitude: coords.latitude, longitude: coords.longitude },
            accuracy: incomingLoc.accuracy || 0,
            timestamp: new Date()
          };
        }
      }

      try {
        const UserAddress = require('../models/UserAddress');
        let addressMatch = await UserAddress.findOne({
          user: checkUserId,
          street: orderData.shippingAddress.street,
          pincode: orderData.shippingAddress.pincode,
          'location.coordinates': { $exists: true, $ne: [] }
        }).sort({ updatedAt: -1 });

        if (!addressMatch) {
          addressMatch = await UserAddress.findOne({
            user: checkUserId,
            pincode: orderData.shippingAddress.pincode,
            'location.coordinates': { $exists: true, $ne: [] }
          }).sort({ updatedAt: -1 });
        }

        if (addressMatch && addressMatch.location?.coordinates?.length === 2) {
          deliveryLocation = {
            coordinates: {
              latitude: addressMatch.location.coordinates[1],
              longitude: addressMatch.location.coordinates[0]
            },
            accuracy: addressMatch.location.accuracy || 0,
            timestamp: addressMatch.location.capturedAt || addressMatch.updatedAt,
            source: addressMatch.savedByAdmin ? 'admin' : 'saved'
          };
        } else if (liveLocation) {
          deliveryLocation = { ...liveLocation, source: 'live' };
        } else {
          // Priority 3: Historical Fallback - Look for ANY previous order from this user with a location
          const lastOrderWithLoc = await Order.findOne({
            user: checkUserId,
            $or: [
              { 'deliveryLocation.coordinates.latitude': { $exists: true, $ne: null } },
              { 'location.coordinates.latitude': { $exists: true, $ne: null } },
              { 'location.lat': { $exists: true, $ne: null } }
            ]
          }).sort({ createdAt: -1 });

          if (lastOrderWithLoc) {
            if (lastOrderWithLoc.deliveryLocation?.coordinates?.latitude) {
              deliveryLocation = { ...lastOrderWithLoc.deliveryLocation, source: 'historical' };
            } else if (lastOrderWithLoc.location) {
              const loc = lastOrderWithLoc.location;
              const coords = loc.coordinates || { latitude: loc.lat, longitude: loc.lng };
              if (coords.latitude || coords.lat) {
                deliveryLocation = {
                  coordinates: {
                    latitude: coords.latitude || coords.lat,
                    longitude: coords.longitude || coords.lng
                  },
                  accuracy: loc.accuracy || 0,
                  timestamp: loc.timestamp || loc.capturedAt || lastOrderWithLoc.createdAt,
                  source: 'historical'
                };
              }
            }
          }
        }
      } catch (locError) {
        if (liveLocation) deliveryLocation = { ...liveLocation, source: 'live' };
      }

      // 6. CREATE AND SAVE ORDER
      const order = new Order({
        ...orderData,
        user: checkUserId,
        items: validatedItems,
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        tax: pricing.taxAmount,
        totalAmount: pricing.totalAmount,

        // Promo & Coin Fields
        promoCode: promoCodeDoc ? promoCodeDoc.code : null,
        discountAmount: pricing.discount,
        coinsUsed: coinsUsed,
        coinDiscount: pricing.coinDiscount,
        coinDebtRecovery: pricing.coinDebtRecovery, // Save the recovery amount
        originalTotal: pricing.subtotal + pricing.shippingFee + pricing.taxAmount + pricing.tipAmount,
        finalTotal: pricing.totalAmount,
        selectedGift: finalSelectedGift || null,
        tipAmount: pricing.tipAmount,
        instruction: instruction,

        // Dual Location Fields
        liveLocation: liveLocation,
        deliveryLocation: deliveryLocation
      });

      const savedOrder = await order.save();

      // Handle Coin Deduction Transaction
      if (coinsUsed > 0) {
        try {
          await CoinService.spendCoins(checkUserId, coinsUsed, savedOrder._id);
        } catch (coinErr) {
          console.error('[OrderService] Coin deduction failed after order save:', coinErr.message);
          // SECURITY FIX: Revert order creation if coin deduction fails to prevent double-spend cheat
          await Order.findByIdAndDelete(savedOrder._id);
          if (promoAppliedSuccessfully && promoCodeDoc) {
            const PromoCodeModel = require('../models/PromoCode');
            await PromoCodeModel.revertUsageAtomic(promoCodeDoc.code, checkUserId, savedOrder._id).catch(() => { });
          }
          throw new AppError('Insufficient RG Coins balance.', 400);
        }
      }

      // DEBT RECOVERY: If user had negative coins, reset them to 0 after order placement
      if (coinDebtRecoveryInRs > 0) {
        await User.findOneAndUpdate(
          { $or: [{ _id: checkUserId }, { googleId: checkUserId }] },
          { $set: { rgCoins: 0 } }
        );
        console.log(`[OrderService] Debt recovered. User ${checkUserId} coin balance reset to 0.`);
      }

      // Finalize promo order link
      if (promoAppliedSuccessfully) {
        await PromoCode.updateOne(
          { _id: promoCodeDoc._id, "usedBy.user": checkUserId },
          { $set: { "usedBy.$.order": savedOrder._id } }
        ).catch(e => console.error('[OrderService] Promo link failed'));
      }

      TelegramService.sendOrderNotification(savedOrder).catch(() => { });

      User.findByIdAndUpdate(checkUserId, {
        $set: { "lastCartSnapshot.items": [] }
      }).catch(() => { });

      return this.formatOrderResponse(savedOrder);

    } catch (error) {
      if (validatedItems.length > 0) {
        await this.updateProductInventory(validatedItems, 'increment').catch(() => { });
      }
      if (error.statusCode) throw error;
      throw new AppError(`Order creation failed: ${error.message}`, 500);
    }
  }

  /**
   * Validate order items and check inventory
   */
  async validateOrderItems(items) {
    if (!items || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }

    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);
      if (!product.active) throw new AppError(`Product is not available: ${product.name}`, 400);
      if (product.stock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);

      const productVariant = product.weights.find(w => w.weight === item.weight);
      if (!productVariant) throw new AppError(`Invalid variant for ${product.name}`, 400);

      const price = productVariant.offerPrice || productVariant.price;
      const validatedItem = {
        productId: product._id,
        name: product.name,
        description: Array.isArray(product.description) ? product.description.join(', ') : product.description || '',
        weight: productVariant.weight,
        unit: productVariant.unit,
        quantity: item.quantity,
        price: price,
        totalPrice: price * item.quantity,
        image: product.images[0] || '',
        sku: product.sku,
        isCustomized: item.isCustomized || false,
        customizationInstructions: item.customizationInstructions || '',
        customizationCharge: 0
      };

      if (validatedItem.isCustomized && product.isCustomizable) {
        const weightValue = parseFloat(productVariant.weight) || 0;
        let totalGrams = productVariant.unit === 'kg' ? weightValue * 1000 * item.quantity : weightValue * item.quantity;
        validatedItem.customizationCharge = this.calculateCustomizationCharge(product, totalGrams);
      }

      validatedItems.push(validatedItem);
      subtotal += validatedItem.totalPrice + (validatedItem.customizationCharge || 0);
    }

    return { validatedItems, subtotal };
  }

  /**
   * Helper to calculate customization charge server-side
   */
  calculateCustomizationCharge(product, weightInGrams) {
    if (!product || !product.isCustomizable || !product.customizationCharges || product.customizationCharges.length === 0) return 0;
    const sortedCharges = [...product.customizationCharges].sort((a, b) => b.weight - a.weight);
    let remainingWeight = weightInGrams;
    let totalCharge = 0;
    for (const rule of sortedCharges) {
      if (rule.weight <= 0) continue;
      const count = Math.floor(remainingWeight / rule.weight);
      if (count > 0) {
        totalCharge += count * rule.charge;
        remainingWeight -= count * rule.weight;
      }
    }
    return totalCharge;
  }

  /**
   * Calculate order pricing with tax and discounts
   */
  async calculatePricing(rawSubtotal, taxRate = 0, rawDiscount = 0, pincode = null, tipAmount = 0, coinDiscountInRs = 0, coinDebtRecoveryInRs = 0) {
    const subtotal = Math.round(rawSubtotal * 100) / 100;
    const discount = Math.round(rawDiscount * 100) / 100;
    const coinDiscount = Math.round(coinDiscountInRs * 100) / 100;
    const coinDebtRecovery = Math.round(coinDebtRecoveryInRs * 100) / 100;

    // The amount that actually determines if delivery is free
    const netPayableForShippingCheck = subtotal - discount - coinDiscount + coinDebtRecovery;

    let shippingFee = 29;
    let freeDeliveryThreshold = 299;

    if (pincode) {
      const serviceArea = await ServiceArea.findOne({ pincode, isActive: true });
      if (serviceArea) {
        shippingFee = serviceArea.deliveryCharge !== undefined ? serviceArea.deliveryCharge : 29;
        freeDeliveryThreshold = serviceArea.minOrderForFreeDelivery !== undefined ? serviceArea.minOrderForFreeDelivery : 299;
      } else {
        throw new AppError(`We do not serve the pincode ${pincode} yet.`, 400);
      }
    } else {
      throw new AppError('Shipping pincode is required', 400);
    }

    // UPDATED LOGIC: If net amount after ALL discounts is below threshold, charge fee
    const finalShippingFee = (subtotal > 0 && netPayableForShippingCheck < freeDeliveryThreshold) ? shippingFee : 0;

    const taxAmount = (subtotal * taxRate) / 100;
    let totalAmount = subtotal + finalShippingFee + taxAmount + tipAmount - discount - coinDiscount + coinDebtRecovery;
    if (totalAmount < 0) totalAmount = 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shippingFee: finalShippingFee,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate,
      discount: Math.round(discount * 100) / 100,
      coinDiscount: coinDiscount,
      coinDebtRecovery: coinDebtRecovery,
      tipAmount: Math.round(tipAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Update product inventory with atomic stock checks
   */
  async updateProductInventory(items, operation) {
    if (!items || items.length === 0) return true;
    const mergedItems = items.reduce((acc, item) => {
      const id = item.productId.toString();
      if (!acc[id]) acc[id] = { productId: item.productId, quantity: 0 };
      acc[id].quantity += item.quantity;
      return acc;
    }, {});

    const itemsToUpdate = Object.values(mergedItems);
    const bulkOperations = itemsToUpdate.map(item => ({
      updateOne: {
        filter: { _id: item.productId, ...(operation === 'decrement' ? { stock: { $gte: item.quantity } } : {}) },
        update: { $inc: { stock: operation === 'decrement' ? -item.quantity : item.quantity, 'meta.purchases': operation === 'decrement' ? item.quantity : -item.quantity } }
      }
    }));

    const result = await Product.bulkWrite(bulkOperations);
    return (result.modifiedCount || result.nModified) === itemsToUpdate.length;
  }

  /**
   * Get orders with pagination and filtering
   */
  async getOrders(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const query = this.buildOrderQuery(filters);
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [{ path: 'user', select: 'name email' }, { path: 'items.productId', select: 'name images sku' }]
    };

    const orders = await Order.find(query).populate(options.populate).sort(options.sort).limit(options.limit * 1).skip((options.page - 1) * options.limit);
    const total = await Order.countDocuments(query);

    return {
      orders: orders.map(order => this.formatOrderResponse(order)),
      pagination: { page: options.page, limit: options.limit, total, pages: Math.ceil(total / options.limit) }
    };
  }

  /**
   * Build MongoDB query from filters
   */
  buildOrderQuery(filters) {
    const query = {};
    if (filters.userId) query.user = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    if (filters.orderNumber) query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
    return query;
  }

  /**
   * Format order response for API
   */
  formatOrderResponse(order) {
    const orderObj = order.toObject ? order.toObject() : order;
    return {
      id: orderObj._id,
      orderNumber: orderObj.orderNumber,
      user: orderObj.user,
      items: orderObj.items,
      status: orderObj.status,
      shippingAddress: orderObj.shippingAddress,
      createdAt: orderObj.createdAt,
      updatedAt: orderObj.updatedAt,
      instruction: orderObj.instruction,
      selectedGift: orderObj.selectedGift,
      liveLocation: orderObj.liveLocation || null,
      deliveryLocation: orderObj.deliveryLocation || orderObj.location || null,
      subtotal: orderObj.subtotal,
      shippingFee: orderObj.shippingFee,
      tax: orderObj.tax,
      totalAmount: orderObj.totalAmount,
      promoCode: orderObj.promoCode,
      discountAmount: orderObj.discountAmount,
      userInfo: orderObj.userInfo,
      coinsUsed: orderObj.coinsUsed,
      coinDiscount: orderObj.coinDiscount,
      coinsEarned: orderObj.coinsEarned,
      finalTotal: orderObj.finalTotal,
      deliveryDate: orderObj.deliveryDate,
      timeSlot: orderObj.timeSlot,
      paymentMethod: orderObj.paymentMethod,
      tipAmount: orderObj.tipAmount
    };
  }

  /**
   * Cancel an order with proper validation
   */
  async cancelOrder(orderId, userId, reason = 'Cancelled by user') {
    // ATOMIC UPDATE: Only update to 'cancelled' if it's currently in a cancellable state.
    // This prevents ghost cancels and double-dip refunds.
    const cancelledOrderDoc = await Order.findOneAndUpdate(
      {
        _id: orderId,
        user: userId,
        status: { $in: ['pending', 'confirmed', 'under_review'] }
      },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason
        }
      },
      { new: true }
    );

    if (!cancelledOrderDoc) {
      throw new AppError('Order not found or cannot be cancelled at this stage.', 400);
    }

    const itemsToRevert = cancelledOrderDoc.items.map(item => ({ productId: item.productId, quantity: item.quantity }));
    const promoToRevert = cancelledOrderDoc.promoCode;

    try {
      // 1. Revert Stock
      if (itemsToRevert.length > 0) await this.updateProductInventory(itemsToRevert, 'increment');

      // 2. Revert Promo
      if (promoToRevert) await PromoCode.revertUsageAtomic(promoToRevert, userId, orderId);

      // 3. Revert RG Coins (Refund Spent)
      await CoinService.revertSpentCoins(cancelledOrderDoc);

      // 4. Revert RG Coins (Snatchback Earned)
      if (cancelledOrderDoc.coinsEarned > 0) {
        await CoinService.revertEarnedCoins(cancelledOrderDoc);
      }

      // 5. RECURSIVE REVERSAL: Claw back referral bonuses
      await CoinService.revertReferralBonus(orderId);

    } catch (err) {
      console.error('[OrderService] Resource reversion failed during cancellation:', err);
    }

    return this.formatOrderResponse(cancelledOrderDoc);
  }

  /**
   * Get order statistics for dashboard
   */
  async getOrderStats(timeframe = 'month') {
    const dateRange = this.getDateRange(timeframe);
    const stats = await Order.aggregate([
      { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' }, pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }, averageOrderValue: { $avg: '$totalAmount' } } }
    ]);
    return stats[0] || { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0, averageOrderValue: 0 };
  }

  async validateSlotAvailability(items, deliveryDate, timeSlot) {
    if (!deliveryDate || !timeSlot) {
      throw new AppError('Delivery date and time slot are required', 400);
    }

    const cleanTimeSlot = timeSlot.split(' (')[0].trim();

    let dateString = deliveryDate;
    if (typeof dateString !== 'string') {
      const d = new Date(dateString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateString = `${year}-${month}-${day}`;
    } else {
      if (dateString.includes('T')) {
        dateString = dateString.split('T')[0];
      }
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = days[d.getDay()];

    const CategorySlotAvailability = require('../models/CategorySlotAvailability');
    const ProductSlotAvailability = require('../models/ProductSlotAvailability');
    const Product = require('../models/Product');

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      // 1. Check category date-specific slot restrictions
      const catRestrictions = await CategorySlotAvailability.find({
        date: dateString,
        isActive: true,
        category: { $in: [product.category, 'All'] }
      });

      for (const restriction of catRestrictions) {
        if (restriction.unavailableSlots.includes(cleanTimeSlot)) {
          throw new AppError(`${product.category} is unavailable during ${timeSlot} on ${dateString}. Reason: ${restriction.reason || 'Unavailable'}`, 400);
        }
      }

      // 2. Check product day-of-week slot restrictions
      const prodRestriction = await ProductSlotAvailability.findOne({
        productId: product._id,
        dayOfWeek,
        isActive: true
      });

      if (prodRestriction && prodRestriction.unavailableSlots.includes(cleanTimeSlot)) {
        throw new AppError(`${product.name} is unavailable during ${timeSlot} on ${dayOfWeek}s. Reason: ${prodRestriction.reason || 'Unavailable'}`, 400);
      }
    }
  }

  getDateRange(timeframe) {
    const end = new Date();
    const start = new Date();
    switch (timeframe) {
      case 'day': start.setHours(0, 0, 0, 0); break;
      case 'week': start.setDate(start.getDate() - 7); break;
      case 'month': start.setMonth(start.getMonth() - 1); break;
      case 'year': start.setFullYear(start.getFullYear() - 1); break;
      default: start.setMonth(start.getMonth() - 1);
    }
    return { start, end };
  }
}

module.exports = new OrderService();