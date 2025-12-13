const fs = require('fs');
const path = require('path');

try {
    require('dotenv').config();

    const modelsPath = path.join(__dirname, 'models');
    console.log('Models directory:', modelsPath);
    if (fs.existsSync(modelsPath)) {
        console.log('Models content:', fs.readdirSync(modelsPath));
    } else {
        console.log('Models directory DOES NOT EXIST');
    }

    const promoPath = path.join(modelsPath, 'PromoCode.js');
    if (fs.existsSync(promoPath)) {
        console.log('PromoCode.js exists at:', promoPath);
    } else {
        console.log('PromoCode.js DOES NOT EXIST at:', promoPath);
    }

    console.log('Loading OrderService...');
    const OrderService = require('./services/OrderService');
    console.log('OrderService loaded.');

    console.log('✅ All modules loaded successfully.');
} catch (error) {
    console.error('❌ Error:', error);
}
