const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

class TelegramService {
    static async sendOrderNotification(order) {
        if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
            console.warn('[TelegramService] Token or Chat ID missing. Skipping notification.');
            return;
        }

        try {
            const itemsText = order.items
                .map((item, index) => {
                    const lineTotal = (item.quantity * item.price) + (item.customizationCharge || 0);
                    let customizationText = '';
                    if (item.isCustomized) {
                        customizationText = `\n   ├ ✨ <b>CUSTOMIZED:</b> ${item.customizationInstructions || 'No instructions'}\n   ├ 💰 Custom Charge: ₹${item.customizationCharge}`;
                    }
                    return `<b>${index + 1}. ${item.name}</b>\n   ├ Variant: ${item.weight}${item.unit}\n   ├ Price: ₹${item.price} x ${item.quantity}${customizationText}\n   └ Total: <b>₹${lineTotal}</b>`;
                })
                .join('\n\n');

            const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

            const message = `
<b>🛍️ NEW ORDER RECEIVED!</b>
------------------------------------
🆔 <b>Order ID:</b> #${order._id.toString().slice(-6).toUpperCase()}
👤 <b>Customer:</b> ${order.userInfo?.name || 'Guest'}
📞 <b>Phone:</b> <code>${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}</code>

<b>🛒 ORDERED ITEMS (${totalItemsCount}):</b>
------------------------------------
${itemsText}

------------------------------------
💰 <b>Subtotal:</b> ₹${order.subtotal}
🚚 <b>Shipping:</b> ₹${order.shippingFee} ${order.shippingFee > 29 ? `(Dist. Surcharge incl.)` : ''}
💝 <b>Delivery Tip:</b> ₹${order.tipAmount || 0}
🏷️ <b>Discount:</b> -₹${order.discountAmount}
✨ <b>Final Amount:</b> <b>₹${order.totalAmount}</b>

🎁 <b>Free Gift:</b> ${order.selectedGift || 'None'}
💳 <b>Payment:</b> ${order.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'}

📅 <b>Delivery:</b> ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
⏰ <b>Slot:</b> ${order.timeSlot}

📍 <b>DELIVERY ADDRESS:</b>
------------------------------------
${order.shippingAddress.fullName}
${order.shippingAddress.street}, ${order.shippingAddress.locality}
${order.shippingAddress.city} - ${order.shippingAddress.pincode}
${order.shippingAddress.landmark ? `<b>Landmark:</b> ${order.shippingAddress.landmark}` : ''}

📝 <b>Note:</b> ${order.instruction || 'None'}

📍 <b>GPS LOCATION:</b>
------------------------------------
${(order.deliveryLocation?.coordinates || order.location?.coordinates || (order.location?.lat && order.location))
                    ? `<a href="https://www.google.com/maps?q=${order.deliveryLocation?.coordinates?.latitude || order.location?.coordinates?.latitude || order.location?.lat},${order.deliveryLocation?.coordinates?.longitude || order.location?.coordinates?.longitude || order.location?.lng}">🏠 Delivery Spot</a>`
                    : 'Not captured'}

${order.liveLocation?.coordinates
                    ? `<a href="https://www.google.com/maps?q=${order.liveLocation.coordinates.latitude},${order.liveLocation.coordinates.longitude}">📍 Live Position (at order)</a>`
                    : ''}

------------------------------------
✅ <b>STATUS:</b> #NEW_ORDER
      `.trim();

            const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

            console.log(`[TelegramService] Sending message to ${TELEGRAM_CHAT_ID}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();
            if (!data.ok) {
                console.error('❌ Telegram API Error:', JSON.stringify(data));
                throw new Error(data.description);
            }

            console.log('✅ Telegram notification sent successfully');
        } catch (error) {
            console.error('❌ Telegram Notification Error:', error.message);
        }
    }

    static async sendRiderPickupNotification(order, rider) {
        if (!TELEGRAM_TOKEN) return;
        const DELIVERY_CHAT_ID = '-5118338826';
        try {
            const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
            const itemsText = order.items
                .map(item => `• ${item.name} (${item.weight}${item.unit}) x${item.quantity}`)
                .join('\n');

            const message = `
🛵 <b>ORDER PICKED UP!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order:</b> #${order._id.toString().slice(-6).toUpperCase()}
🕐 <b>Picked At:</b> ${now}

👷 <b>RIDER DETAILS:</b>
━━━━━━━━━━━━━━━━━━━━
🧑 <b>Name:</b> ${rider.name}
📞 <b>Phone:</b> <code>${rider.phone}</code>
🚗 <b>Vehicle:</b> ${rider.vehiclePlateNumber || 'N/A'}

👤 <b>CUSTOMER:</b>
━━━━━━━━━━━━━━━━━━━━
🙍 <b>Name:</b> ${order.userInfo?.name || 'Guest'}
📱 <b>Phone:</b> <code>${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}</code>
📍 <b>Address:</b> ${order.shippingAddress.street}, ${order.shippingAddress.locality}, ${order.shippingAddress.city}
${order.shippingAddress.landmark ? `🏷️ <b>Landmark:</b> ${order.shippingAddress.landmark}` : ''}

🛒 <b>ITEMS:</b>
━━━━━━━━━━━━━━━━━━━━
${itemsText}

💰 <b>Amount:</b> ₹${order.totalAmount} (${order.paymentMethod?.replace(/_/g, ' ').toUpperCase()})
━━━━━━━━━━━━━━━━━━━━
🟡 <b>STATUS: OUT FOR DELIVERY</b>
            `.trim();

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: DELIVERY_CHAT_ID, text: message, parse_mode: 'HTML' })
            });
            console.log('✅ Rider pickup notification sent');
        } catch (error) {
            console.error('❌ Rider pickup notification error:', error.message);
        }
    }

    static async sendRiderDeliveryNotification(order, rider) {
        if (!TELEGRAM_TOKEN) return;
        const DELIVERY_CHAT_ID = '-5118338826';
        try {
            const deliveredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
            const acceptedAt = order.statusHistory?.find(h => h.status === 'shipped')?.timestamp || order.updatedAt || order.createdAt;
            const acceptedTime = new Date(acceptedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

            const message = `
✅ <b>ORDER DELIVERED!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order:</b> #${order._id.toString().slice(-6).toUpperCase()}
🕐 <b>Picked Up:</b> ${acceptedTime}
🕑 <b>Delivered At:</b> ${deliveredAt}
${order.proofOfDelivery?.isForcefullyDelivered ? '⚠️ <b>FORCEFUL DELIVERY (Outside Geofence)</b>' : ''}

👷 <b>RIDER:</b>
━━━━━━━━━━━━━━━━━━━━
🧑 <b>Name:</b> ${rider.name}
📞 <b>Phone:</b> <code>${rider.phone}</code>

👤 <b>CUSTOMER:</b>
━━━━━━━━━━━━━━━━━━━━
🙍 <b>Name:</b> ${order.userInfo?.name || 'Guest'}
📱 <b>Phone:</b> <code>${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}</code>
📍 <b>Address:</b> ${order.shippingAddress.street}, ${order.shippingAddress.locality}, ${order.shippingAddress.city}

💰 <b>Amount Collected:</b> ₹${order.totalAmount} (${order.paymentMethod?.replace(/_/g, ' ').toUpperCase()})
━━━━━━━━━━━━━━━━━━━━
🟢 <b>STATUS: DELIVERED ✓</b>
            `.trim();

            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: DELIVERY_CHAT_ID, text: message, parse_mode: 'HTML' })
            });
            console.log('✅ Rider delivery notification sent');
        } catch (error) {
            console.error('❌ Rider delivery notification error:', error.message);
        }
    }

    static async sendOrderCancellationNotification(order, reason = 'No reason provided') {
        if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
            console.warn('[TelegramService] Token or Chat ID missing. Skipping cancellation notification.');
            return;
        }

        try {
            const message = `
<b>❌ ORDER CANCELLED!</b>
------------------------------------
🆔 <b>Order ID:</b> #${order._id.toString().slice(-6).toUpperCase()}
👤 <b>Customer:</b> ${order.userInfo?.name || 'Guest'}
📞 <b>Phone:</b> <code>${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}</code>

⚠️ <b>Reason:</b> <i>${reason}</i>

💰 <b>Amount Saved:</b> ₹${order.totalAmount}
📅 <b>Was Scheduled for:</b> ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
⏰ <b>Slot:</b> ${order.timeSlot}

------------------------------------
❌ <b>STATUS:</b> #CANCELLED
      `.trim();

            const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();
            if (!data.ok) {
                console.error('❌ Telegram API Error:', JSON.stringify(data));
                throw new Error(data.description);
            }

            console.log('✅ Telegram cancellation notification sent successfully');
        } catch (error) {
            console.error('❌ Telegram Cancellation Notification Error:', error.message);
        }
    }
}

module.exports = TelegramService;
