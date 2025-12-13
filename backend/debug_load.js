try {
    require('dotenv').config();
    const mongoose = require('mongoose');

    console.log('Loading Order model...');
    const Order = require('./models/Order');
    console.log('Order model loaded.');

    console.log('Loading PromoCode model...');
    const PromoCode = require('./models/PromoCode');
    console.log('PromoCode model loaded.');

    console.log('Loading OrderService...');
    const OrderService = require('./services/OrderService');
    console.log('OrderService loaded.');

    console.log('Loading promoCodeController...');
    const promoController = require('./controllers/promoCodeController');
    console.log('promoCodeController loaded.');

    console.log('Loading promoCodeRoutes...');
    const promoRoutes = require('./routes/promoCodeRoutes');
    console.log('promoCodeRoutes loaded.');

    console.log('✅ All modules loaded successfully.');
    process.exit(0);
} catch (error) {
    console.error('❌ Error loading modules:', error);
    process.exit(1);
}
