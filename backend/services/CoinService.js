const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const RewardConfig = require('../models/RewardConfig');
const Order = require('../models/Order');

class CoinService {
    /**
     * Get a specific reward configuration value
     */
    async getConfig(key, defaultValue) {
        try {
            const config = await RewardConfig.findOne({ key });
            return config ? config.value : defaultValue;
        } catch (error) {
            console.error(`Error fetching config ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Deduct coins from user for an order
     */
    async spendCoins(userId, amount, orderId) {
        if (amount <= 0) return;

        const query = {
            $or: [
                { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
                { googleId: userId }
            ].filter(q => q._id !== null || q.googleId !== undefined),
            rgCoins: { $gte: amount }
        };

        const user = await User.findOneAndUpdate(
            query,
            { $inc: { rgCoins: -amount } },
            { new: true }
        );

        if (!user) {
            throw new Error('Insufficient RG Coins balance or user not found');
        }

        const transaction = new CoinTransaction({
            userId: user._id,
            amount: -amount,
            type: 'SPENT_ORDER',
            referenceId: orderId,
            runningBalance: user.rgCoins,
            note: `Used for order #${orderId}`
        });

        await transaction.save();
        return transaction;
    }

    /**
     * Award coins to user for a delivered order
     */
    async awardOrderCoins(order) {
        const rewardPercent = await this.getConfig('orderRewardPercent', 2);
        const conversionRate = await this.getConfig('conversionRate', 10);

        // ATOMIC LOCK: Try to update the order to "coins awarded" status only IF it wasn't already awarded.
        // This mathematically prevents double payouts even if two requests hit at the same millisecond.
        const freshOrder = await Order.findOneAndUpdate(
            { 
                _id: order._id, 
                coinsEarned: 0, // Critical check: must be 0
                status: 'delivered' // Critical check: must be delivered
            },
            { 
                // We'll set a temporary value to "lock" it while we calculate
                $set: { coinsEarned: -1 } 
            },
            { new: true }
        );

        if (!freshOrder) {
            console.log(`[CoinService] Award locked or already processed for order ${order._id}`);
            return;
        }

        try {
            // Earn only on net cash paid (after discount)
            const netCash = freshOrder.finalTotal || freshOrder.totalAmount || 0; 
            const coinsToEarn = Math.floor((netCash * rewardPercent) / 100 * conversionRate);

            if (coinsToEarn <= 0) {
                // Unlock with 0 if no coins earned
                await Order.findByIdAndUpdate(freshOrder._id, { coinsEarned: 0 });
                return;
            }

            // Robust user lookup
            const userIdStr = String(freshOrder.user);
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(userIdStr);
            const userQuery = isMongoId ? { _id: userIdStr } : { googleId: userIdStr };

            const user = await User.findOneAndUpdate(
                userQuery,
                { $inc: { rgCoins: coinsToEarn } },
                { new: true }
            );

            if (!user) {
                // Rollback order lock if user missing
                await Order.findByIdAndUpdate(freshOrder._id, { coinsEarned: 0 });
                console.error(`[CoinService] User not found for order ${freshOrder._id}. Query:`, userQuery);
                return;
            }

            const transaction = new CoinTransaction({
                userId: user._id,
                amount: coinsToEarn,
                type: 'EARNED_ORDER',
                referenceId: freshOrder._id,
                runningBalance: user.rgCoins,
                note: `Earned from order #${freshOrder._id}`
            });

            await transaction.save();

            // Finalize the lock with the actual amount
            await Order.findByIdAndUpdate(freshOrder._id, { coinsEarned: coinsToEarn });
            console.log(`[CoinService] Successfully awarded ${coinsToEarn} coins for order ${freshOrder._id} to user ${user.email}`);

            // Handle Referral Reward (only for the first delivered order)
            await this.handleReferralReward(user, freshOrder);

            return transaction;
        } catch (error) {
            // Rollback lock on catastrophic failure
            await Order.findByIdAndUpdate(freshOrder._id, { coinsEarned: 0 });
            throw error;
        }
    }

    /**
     * Handle referral bonus when a friend completes their first order
     */
    async handleReferralReward(user, firstOrder) {
        if (!user.referredBy) return;

        const deliveryPhone = firstOrder.shippingAddress?.phoneNumber;

        // 1. IDENTITY PROTECTION (Anti-Cheat)
        // Rule A: Check if this phone number has EVER received a successful order before.
        const phoneAlreadyServed = await Order.findOne({
            'shippingAddress.phoneNumber': deliveryPhone,
            status: 'delivered',
            _id: { $ne: firstOrder._id }
        });

        if (phoneAlreadyServed) {
            console.log(`[CoinService] Referral blocked: Phone ${deliveryPhone} is already an existing customer.`);
            return;
        }

        // Rule B: Check if the delivery phone belongs to the Referrer themselves.
        const referrer = await User.findById(user.referredBy);
        if (referrer && referrer.phone === deliveryPhone) {
            console.log(`[CoinService] Referral blocked: Referrer attempted to refer their own phone number.`);
            return;
        }

        // 2. Check if this is truly the user's first delivered order
        const previousDelivered = await Order.countDocuments({
            user: { $in: [user._id.toString(), user.googleId] },
            status: 'delivered',
            _id: { $ne: firstOrder._id }
        });

        if (previousDelivered > 0) return;

        const minOrderValue = await this.getConfig('minOrderForReferral', 299);
        if (firstOrder.totalAmount < minOrderValue) {
            console.log(`[CoinService] Referral reward skipped: Order total ₹${firstOrder.totalAmount} is below threshold ₹${minOrderValue}`);
            return;
        }

        const referralBonus = await this.getConfig('referralRewardCoins', 300);

        // 3. Award to Referrer ONLY
        // (Per User request: The friend already got 300 at signup, so only the referrer gets reward now)
        if (referrer) {
            const updatedReferrer = await User.findByIdAndUpdate(
                referrer._id, 
                { $inc: { rgCoins: referralBonus } },
                { new: true }
            );

            if (updatedReferrer) {
                const referrerTx = new CoinTransaction({
                    userId: referrer._id,
                    amount: referralBonus,
                    type: 'REFERRAL_REWARD',
                    referenceId: firstOrder._id,
                    runningBalance: updatedReferrer.rgCoins,
                    note: `Referral reward for friend ${user.name}'s first order #${firstOrder._id}`
                });
                await referrerTx.save();
                console.log(`[CoinService] Awarded ${referralBonus} coins to referrer ${referrer.email}`);
            }
        }
    }

    /**
     * Revert spent coins if order is cancelled
     */
    async revertSpentCoins(order) {
        if (!order.coinsUsed || order.coinsUsed <= 0) return;

        const userIdStr = String(order.user);
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(userIdStr);
        const userQuery = isMongoId ? { _id: userIdStr } : { googleId: userIdStr };

        const user = await User.findOneAndUpdate(
            userQuery,
            { $inc: { rgCoins: order.coinsUsed } },
            { new: true }
        );

        if (!user) return;

        const transaction = new CoinTransaction({
            userId: user._id,
            amount: order.coinsUsed,
            type: 'REVERSED',
            referenceId: order._id,
            runningBalance: user.rgCoins,
            note: `Refund for cancelled order #${order._id}`
        });

        await transaction.save();
        console.log(`[CoinService] Refunded ${order.coinsUsed} spent coins for order ${order._id}`);
    }

    /**
     * Revert earned coins if order is cancelled after being delivered
     */
    async revertEarnedCoins(order) {
        if (!order.coinsEarned || order.coinsEarned <= 0) return;

        const userIdStr = String(order.user);
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(userIdStr);
        const userQuery = isMongoId ? { _id: userIdStr } : { googleId: userIdStr };

        // Note: We use a negative increment to subtract the coins
        const user = await User.findOneAndUpdate(
            userQuery,
            { $inc: { rgCoins: -order.coinsEarned } },
            { new: true }
        );

        if (!user) return;

        const transaction = new CoinTransaction({
            userId: user._id,
            amount: -order.coinsEarned,
            type: 'REVERSED',
            referenceId: order._id,
            runningBalance: user.rgCoins,
            note: `Reversal of earned coins for cancelled order #${order._id}`
        });

        await transaction.save();

        // Update order record
        await Order.findByIdAndUpdate(order._id, { coinsEarned: 0 });
        
        console.log(`[CoinService] Reverted ${Math.abs(transaction.amount)} earned coins for order ${order._id}`);
    }

    /**
     * RECURSIVE REVERSAL: Claw back referral bonuses if the triggering order is cancelled
     */
    async revertReferralBonus(orderId) {
        try {
            // Find all transactions linked to this order as referral bonuses
            const transactions = await CoinTransaction.find({
                referenceId: orderId,
                type: { $in: ['REFERRAL_REWARD', 'REFERRAL_BONUS'] }
            });

            for (const tx of transactions) {
                const user = await User.findByIdAndUpdate(
                    tx.userId,
                    { $inc: { rgCoins: -tx.amount } }, // Reverse the exact amount
                    { new: true }
                );

                if (user) {
                    const reversal = new CoinTransaction({
                        userId: user._id,
                        amount: -tx.amount,
                        type: 'REVERSED',
                        referenceId: orderId,
                        runningBalance: user.rgCoins,
                        note: `Reversal of ${tx.type.replace('_', ' ')} due to order cancellation`
                    });
                    await reversal.save();
                    console.log(`[CoinService] Clawed back ${tx.amount} coins from ${user.email} (Referral Reversal)`);
                }
            }
        } catch (error) {
            console.error('[CoinService] Referral reversal failed:', error.message);
        }
    }

    /**
     * Award welcome bonus to new user
     */
    async awardWelcomeBonus(userId) {
        const bonusCoins = await this.getConfig('signupBonusCoins', 100);
        if (bonusCoins <= 0) return;

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { rgCoins: bonusCoins } },
            { new: true }
        );

        if (!user) return;

        const transaction = new CoinTransaction({
            userId: user._id,
            amount: bonusCoins,
            type: 'WELCOME_BONUS',
            referenceId: user._id,
            runningBalance: user.rgCoins,
            note: 'Welcome bonus for joining RG Basket'
        });

        await transaction.save();
        return transaction;
    }

    /**
     * Award extra bonus to user joining via referral
     */
    async awardRefereeBonus(userId) {
        const bonusCoins = await this.getConfig('refereeBonusCoins', 300);
        if (bonusCoins <= 0) return;

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { rgCoins: bonusCoins } },
            { new: true }
        );

        if (!user) return;

        const transaction = new CoinTransaction({
            userId: user._id,
            amount: bonusCoins,
            type: 'REFERRAL_BONUS',
            referenceId: user._id,
            runningBalance: user.rgCoins,
            note: 'Bonus for joining via referral'
        });

        await transaction.save();
        return transaction;
    }

    /**
     * Admin manual adjustment
     */
    async adminAdjust(userId, amount, adminId, note) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { rgCoins: amount } },
            { new: true }
        );
        
        if (!user) throw new Error('User not found');

        const transaction = new CoinTransaction({
            userId: user._id,
            amount: amount,
            type: 'ADMIN_ADJUST',
            referenceId: adminId,
            runningBalance: user.rgCoins,
            note: note || 'Admin adjustment'
        });

        await transaction.save();
        return transaction;
    }
}

module.exports = new CoinService();