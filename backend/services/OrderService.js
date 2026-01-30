const Order = require('../models/Order');
const Product = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const ServiceArea = require('../models/ServiceArea');
const Offer = require('../models/Offer');
const TelegramService = require('./TelegramService');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class OrderService {
  /**
   * Create a new order with inventory validation and pricing calculation
   */
  async createOrder(orderData, userId) {
    try {
      // 1. INPUT SANITIZATION & USER AUTH CHECK
      const checkUserId = userId || orderData.user || orderData.userId;
      if (!checkUserId) throw new AppError('Authentication required to place order', 401);

      // Sanitize delivery instructions to prevent XSS/Injection
      const instruction = orderData.instruction
        ? orderData.instruction.toString().replace(/[<>]/g, '').slice(0, 1000)
        : "";

      console.log('🛒 OrderService receiving data. User:', checkUserId);
      // Validate products and inventory
      const { validatedItems, subtotal } = await this.validateOrderItems(orderData.items);

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

        // Ensure we have a valid userId to check against
        const checkUserId = userId || orderData.user || orderData.userId;

        console.log(`[OrderService] Validating promo ${promoCodeDoc.code} for user ${checkUserId}`);
        console.log(`[OrderService] Code used by:`, promoCodeDoc.usedBy.map(u => u.user));

        if (!checkUserId) {
          console.warn('[OrderService] Warning: No userId provided for promo validation');
        } else {
          // Check if user has already used this code
          const hasUsed = promoCodeDoc.usedBy.some(usage => {
            // Handle both populated user objects or string IDs
            const usedId = usage.user && usage.user._id ? usage.user._id.toString() : usage.user.toString();
            return usedId === checkUserId.toString();
          });

          if (hasUsed) {
            console.log(`[OrderService] Blocked: User ${checkUserId} already used ${promoCodeDoc.code}`);
            throw new AppError('You have already used this promo code', 400);
          }
        }

        // Calculate discount on subtotal
        discountAmount = promoCodeDoc.calculateDiscount(subtotal);
      }

      // Calculate pricing (ignore client taxRate for security, use 0 or fetch from settings)
      const pincode = orderData.shippingAddress?.pincode;
      const tipAmount = Math.max(0, Number(orderData.tipAmount) || 0);
      const pricing = await this.calculatePricing(subtotal, 0, discountAmount, pincode, tipAmount);

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
          console.warn(`[OrderService] Anti-Cheat: Blocked invalid gift "${finalSelectedGift}" for subtotal ₹${pricing.subtotal}`);
          finalSelectedGift = null; // Strip the gift if they didn't earn it
        }
      }
      // 3. ATOMIC STOCK LOCKING
      // We decrement stock BEFORE saving the order to ensure it's still there.
      // If 10,000 people order at once, only those where stock >= quantity will pass.
      const stockUpdated = await this.updateProductInventory(validatedItems, 'decrement');
      if (!stockUpdated) {
        throw new AppError('One or more items became out of stock during checkout. Please refresh your cart.', 400);
      }

      // 4. ATOMIC PROMO LOCKING (Bank-Grade)
      let promoAppliedSuccessfully = false;
      if (promoCodeDoc) {
        try {
          await PromoCode.registerUsageAtomic(
            promoCodeDoc._id,
            checkUserId,
            "PENDING_" + Date.now(), // Temporary ID since order isn't saved yet
            pricing.discount
          );
          promoAppliedSuccessfully = true;
        } catch (err) {
          // If promo fail (user cheated or used concurrently), we MUST REVERT the stock we just took!
          await this.updateProductInventory(validatedItems, 'increment');
          throw new AppError('Promo code could not be applied. It may have been used in another tab.', 400);
        }
      }

      // 5. CREATE AND SAVE ORDER
      const order = new Order({
        ...orderData,
        user: checkUserId,
        items: validatedItems,
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        tax: pricing.taxAmount,
        totalAmount: pricing.totalAmount,

        // Promo Fields
        promoCode: promoCodeDoc ? promoCodeDoc.code : null,
        discountAmount: pricing.discount,
        originalTotal: pricing.subtotal + pricing.shippingFee + pricing.taxAmount + pricing.tipAmount, // pre-discount
        finalTotal: pricing.totalAmount,
        selectedGift: finalSelectedGift || null,
        tipAmount: pricing.tipAmount,
        instruction: instruction
      });

      const savedOrder = await order.save();

      // Finalize promo order link (Atomic update of the reference)
      if (promoAppliedSuccessfully) {
        await PromoCode.updateOne(
          { _id: promoCodeDoc._id, "usedBy.user": checkUserId },
          { $set: { "usedBy.$.order": savedOrder._id } }
        ).catch(e => console.error('[OrderService] Non-critical: Failed to link order ID to promo usage'));
      }

      // Send Telegram Notification (Async)
      TelegramService.sendOrderNotification(savedOrder).catch(err =>
        console.error('[OrderService] Telegram Notification failed:', err.message)
      );

      // 6. CLEAR INTENT DATA (Cleanup after order)
      User.findByIdAndUpdate(checkUserId, {
        $set: { "lastCartSnapshot.items": [] }
      }).catch(e => console.error('[OrderService] Non-critical: Failed to clear user cart snapshot after order'));

      return this.formatOrderResponse(savedOrder);

    } catch (error) {
      console.error('[OrderService] Order creation error:', error);

      // Safety Revert: If stock was taken but order failed to save, try to restore it
      try {
        if (typeof validatedItems !== 'undefined' && validatedItems.length > 0) {
          await this.updateProductInventory(validatedItems, 'increment');
        }

        // If promo was taken, we ideally should pull it from `usedBy`, but it's non-trivial 
        // without knowing exactly if it was pushed. For now, stock restoration is most critical.
      } catch (revertError) {
        console.error('[OrderService] Critical: Failed to revert stock after order failure!', revertError);
      }

      if (error.statusCode) throw error; // Pass through AppErrors
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

      if (!product) {
        throw new AppError(`Product not found: ${item.productId}`, 404);
      }

      if (!product.active) {
        throw new AppError(`Product is not available: ${product.name}`, 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
      }

      // Max item quantity anti-abuse (e.g. max 50 units per product per order)
      if (item.quantity > 50) {
        throw new AppError(`Quantity limit reached for ${product.name}. Max 50 units allowed.`, 400);
      }

      // Find the specific weight variant ordered
      const productVariant = product.weights.find(w => w.weight === item.weight);

      if (!productVariant) {
        throw new AppError(`Invalid weight/variant "${item.weight}" for product ${product.name}`, 400);
      }

      const price = productVariant.offerPrice || productVariant.price;

      if (isNaN(price)) {
        throw new AppError(`Invalid price for product ${product.name}`, 500);
      }

      const validatedItem = {
        productId: product._id,
        name: product.name,
        // Description in Product model is [String], but Order model expects String
        description: Array.isArray(product.description)
          ? product.description.join(', ')
          : product.description || '',
        weight: productVariant.weight,
        unit: productVariant.unit,
        quantity: item.quantity,
        price: price, // Mapped to 'price' in Order schema (not unitPrice)
        totalPrice: price * item.quantity, // Not stored in schema item but used for subtotal calculation
        image: product.images[0] || '',
        sku: product.sku,
        // Customization fields
        isCustomized: item.isCustomized || false,
        customizationInstructions: item.customizationInstructions || '',
        customizationCharge: 0
      };

      // Server-side validation of customization charge
      if (validatedItem.isCustomized && product.isCustomizable) {
        const weightValue = parseFloat(productVariant.weight) || 0;
        let totalGrams = 0;
        if (productVariant.unit === 'kg') {
          totalGrams = weightValue * 1000 * item.quantity;
        } else if (productVariant.unit === 'g') {
          totalGrams = weightValue * item.quantity;
        }

        const calculatedCharge = this.calculateCustomizationCharge(product, totalGrams);
        validatedItem.customizationCharge = calculatedCharge;
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

    // Sort charges by weight descending to match largest units first
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
  async calculatePricing(rawSubtotal, taxRate = 0, rawDiscount = 0, pincode = null, tipAmount = 0) {
    const subtotal = Math.round(rawSubtotal * 100) / 100;
    const discount = Math.round(rawDiscount * 100) / 100;
    const netValue = subtotal - discount;

    let shippingFee = 29;
    let freeDeliveryThreshold = 299;

    if (pincode) {
      const serviceArea = await ServiceArea.findOne({ pincode, isActive: true });
      if (serviceArea) {
        shippingFee = serviceArea.deliveryCharge !== undefined ? serviceArea.deliveryCharge : 29;
        freeDeliveryThreshold = serviceArea.minOrderForFreeDelivery !== undefined ? serviceArea.minOrderForFreeDelivery : 299;
      } else {
        // Strict Security: Do not allow orders to unserviced pincodes at the API level
        throw new AppError(`We do not serve the pincode ${pincode} yet.`, 400);
      }
    } else {
      throw new AppError('Shipping pincode is required', 400);
    }

    const finalShippingFee = (subtotal > 0 && netValue < freeDeliveryThreshold) ? shippingFee : 0;
    const taxAmount = (subtotal * taxRate) / 100;
    let totalAmount = subtotal + finalShippingFee + taxAmount + tipAmount - discount;
    if (totalAmount < 0) totalAmount = 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shippingFee: finalShippingFee,
      taxAmount: Math.round(taxAmount * 100) / 100,
      taxRate,
      discount: Math.round(discount * 100) / 100,
      tipAmount: Math.round(tipAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Update product inventory with atomic stock checks
   */
  async updateProductInventory(items, operation) {
    if (!items || items.length === 0) return true;

    // Merge quantities by productId to avoid multiple updates to same document in one bulkWrite
    const mergedItems = items.reduce((acc, item) => {
      const id = item.productId.toString();
      if (!acc[id]) {
        acc[id] = { productId: item.productId, quantity: 0 };
      }
      acc[id].quantity += item.quantity;
      return acc;
    }, {});

    const itemsToUpdate = Object.values(mergedItems);

    const bulkOperations = itemsToUpdate.map(item => ({
      updateOne: {
        filter: {
          _id: item.productId,
          ...(operation === 'decrement' ? { stock: { $gte: item.quantity } } : {})
        },
        update: {
          $inc: {
            stock: operation === 'decrement' ? -item.quantity : item.quantity,
            'meta.purchases': operation === 'decrement' ? item.quantity : -item.quantity
          }
        }
      }
    }));

    const result = await Product.bulkWrite(bulkOperations);

    // Check if all operations succeeded
    const success = (result.modifiedCount || result.nModified) === itemsToUpdate.length;

    // If partial failure occurred during decrement, we should ideally revert, 
    // but without transactions, we at least prevent the order from being created.
    return success;
  }

  /**
   * Get orders with pagination and filtering
   */
  async getOrders(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const query = this.buildOrderQuery(filters);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'items.productId', select: 'name images sku' }
      ]
    };

    const orders = await Order.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await Order.countDocuments(query);

    return {
      orders: orders.map(order => this.formatOrderResponse(order)),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
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
    if (filters.orderNumber) {
      query.orderNumber = { $regex: filters.orderNumber, $options: 'i' };
    }

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
      pricing: orderObj.pricing,
      status: orderObj.status,
      statusHistory: orderObj.statusHistory,
      shippingAddress: orderObj.shippingAddress,
      paymentInfo: orderObj.paymentInfo,
      deliveryInfo: orderObj.deliveryInfo,
      notes: orderObj.notes,
      createdAt: orderObj.createdAt,
      updatedAt: orderObj.updatedAt,
      isDelivered: orderObj.isDelivered,
      isCancellable: orderObj.isCancellable,
      instruction: orderObj.instruction,
      selectedGift: orderObj.selectedGift,
      location: orderObj.location,
      subtotal: orderObj.subtotal,
      shippingFee: orderObj.shippingFee,
      tax: orderObj.tax,
      totalAmount: orderObj.totalAmount,
      promoCode: orderObj.promoCode,
      discountAmount: orderObj.discountAmount,
      originalTotal: orderObj.originalTotal,
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
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.isCancellable) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    // Capture items and promo before cancellation for cleanup
    const itemsToRevert = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    const promoToRevert = order.promoCode;

    const cancelledOrder = await order.cancelOrder(reason);

    // Atomic Reversions (Inventory and Promo)
    try {
      if (itemsToRevert.length > 0) {
        await this.updateProductInventory(itemsToRevert, 'increment');
        console.log(`[OrderService] Reverted stock for cancelled order ${orderId}`);
      }

      if (promoToRevert) {
        await PromoCode.revertUsageAtomic(promoToRevert, userId, orderId);
        console.log(`[OrderService] Reverted promo usage for cancelled order ${orderId}`);
      }
    } catch (err) {
      console.error('[OrderService] Critical Background Error: Failed to revert resources for cancelled order:', err);
      // We don't throw here because the order IS cancelled in DB, 
      // but we log it for admin manual reconciliation.
    }

    return this.formatOrderResponse(cancelledOrder);
  }

  /**
   * Get order statistics for dashboard
   */
  async getOrderStats(timeframe = 'month') {
    const dateRange = this.getDateRange(timeframe);

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          averageOrderValue: { $avg: '$pricing.totalAmount' }
        }
      }
    ]);

    return stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      averageOrderValue: 0
    };
  }

  getDateRange(timeframe) {
    const end = new Date();
    const start = new Date();

    switch (timeframe) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    return { start, end };
  }
}

module.exports = new OrderService();