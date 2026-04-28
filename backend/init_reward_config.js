const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const RewardConfig = require('./models/RewardConfig');

const MONGODB_URI = process.env.MONGODB_URI;

const defaultConfigs = [
    { key: 'conversionRate', value: 10, description: 'RG Coins conversion rate' },
    { key: 'maxRedemptionRupees', value: 30, description: 'Maximum coins allowed per order' },
    { key: 'orderRewardPercent', value: 2, description: 'Cashback percentage in coins' },
    { key: 'referralRewardCoins', value: 500, description: 'Referral bonus reward' },
    { key: 'refereeBonusCoins', value: 300, description: 'Bonus for user joining via referral' },
    { key: 'signupBonusCoins', value: 100, description: 'Welcome bonus for new signups' },
    { key: 'minOrderForReferral', value: 299, description: 'Minimum order value for referral bonus' },
    { key: 'minOrderForRedemption', value: 150, description: 'Minimum order value to redeem coins' }
];

async function init() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const config of defaultConfigs) {
            await RewardConfig.findOneAndUpdate(
                { key: config.key },
                { $setOnInsert: config },
                { upsert: true, new: true }
            );
            console.log(`Initialized/Verified config: ${config.key}`);
        }

        console.log('Initialization complete');
        process.exit(0);
    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
}

init();