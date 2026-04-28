const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

class TelegramService {
    static async sendOrderNotification(order) {
        if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
            console.warn('[TelegramService] Token or Chat ID missing. Skipping notification.');
            return;
        }

        try {
            const orderId = order._id || order.id || 'N/A';
            
            // Helper to escape HTML characters
            const escapeHTML = (str) => {
                if (!str) return '';
                return str.toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            };

            const itemsText = order.items
                .map((item, index) => {
                    const lineTotal = (item.quantity * item.price) + (item.customizationCharge || 0);
                    let customizationText = '';
                    if (item.isCustomized) {
                        customizationText = `\n   ├ ✨ <b>CUSTOM:</b> ${escapeHTML(item.customizationInstructions || 'No instructions')}\n   ├ 💰 Charge: ₹${item.customizationCharge}`;
                    }
                    return `<b>${index + 1}. ${escapeHTML(item.name)}</b>\n   ├ Variant: ${item.weight}${item.unit}\n   ├ Price: ₹${item.price} x ${item.quantity}${customizationText}\n   └ Total: <b>₹${lineTotal.toFixed(2)}</b>`;
                })
                .join('\n\n');

            const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

            const customerName = escapeHTML(order.userInfo?.name || (order.shippingAddress && order.shippingAddress.fullName) || 'Guest');
            const customerPhone = escapeHTML(order.userInfo?.phone || (order.shippingAddress && order.shippingAddress.phoneNumber) || 'N/A');
            const customerEmail = escapeHTML(order.userInfo?.email || 'N/A');
            const deliverySlot = escapeHTML(order.timeSlot || 'N/A');
            const instruction = escapeHTML(order.instruction || 'None');

            const message = `
<b>🛍️ NEW ORDER RECEIVED!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> #${orderId.toString().slice(-8).toUpperCase()}
👤 <b>Customer:</b> ${customerName}
📞 <b>Phone:</b> <code>${customerPhone}</code>
📧 <b>Email:</b> ${customerEmail}

<b>🛒 ORDERED ITEMS (${totalItemsCount}):</b>
━━━━━━━━━━━━━━━━━━━━
${itemsText}

<b>💰 BILL DETAILS:</b>
━━━━━━━━━━━━━━━━━━━━
💰 <b>Subtotal:</b> ₹${order.subtotal.toFixed(2)}
🚚 <b>Shipping:</b> ₹${order.shippingFee.toFixed(2)} ${order.shippingFee > 29 ? `(Extra Mile incl.)` : ''}
💝 <b>Rider Tip:</b> ₹${(order.tipAmount || 0).toFixed(2)}
🏷️ <b>Promo Discount:</b> -₹${(order.discountAmount || 0).toFixed(2)}
🪙 <b>RG Coins Used:</b> -₹${(order.coinDiscount || 0).toFixed(2)} (${order.coinsUsed || 0} pts)
━━━━━━━━━━━━━━━━━━━━
✨ <b>FINAL TOTAL:</b> <b>₹${order.totalAmount.toFixed(2)}</b>
💰 <b>PAYMENT:</b> <b>${order.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</b>
━━━━━━━━━━━━━━━━━━━━
🎁 <b>Free Gift:</b> ${escapeHTML(order.selectedGift || 'None')}
🎉 <b>Coins to Earn:</b> +${order.coinsEarned || 0} 🪙

📅 <b>Delivery:</b> ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
⏰ <b>Slot:</b> ${deliverySlot}

📍 <b>DELIVERY ADDRESS:</b>
━━━━━━━━━━━━━━━━━━━━
<b>${customerName}</b>
${escapeHTML(order.shippingAddress?.street)}, ${escapeHTML(order.shippingAddress?.locality)}
${escapeHTML(order.shippingAddress?.city)} - ${escapeHTML(order.shippingAddress?.pincode)}
${order.shippingAddress?.landmark ? `<b>Landmark:</b> ${escapeHTML(order.shippingAddress.landmark)}` : ''}
${order.shippingAddress?.alternatePhone ? `<b>Alt Phone:</b> <code>${escapeHTML(order.shippingAddress.alternatePhone)}</code>` : ''}

📝 <b>Note:</b> <i>${instruction}</i>

📍 <b>LOCATION INTELLIGENCE:</b>
━━━━━━━━━━━━━━━━━━━━
${(order.location?.coordinates?.latitude && order.location?.coordinates?.longitude)
                    ? `🏠 <b>Order GPS:</b> <a href="https://www.google.com/maps?q=${order.location.coordinates.latitude},${order.location.coordinates.longitude}">Open in Google Maps</a>`
                    : '❌ GPS coordinates not captured'}

${(order.liveLocation?.coordinates?.latitude)
                    ? `📍 <b>Live Snapshot:</b> <a href="https://www.google.com/maps?q=${order.liveLocation.coordinates.latitude},${order.liveLocation.coordinates.longitude}">Current Position</a>`
                    : ''}

━━━━━━━━━━━━━━━━━━━━
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
            const orderId = order._id || order.id || 'N/A';
            const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
            const itemsText = order.items
                .map(item => `• ${item.name} (${item.weight}${item.unit}) x${item.quantity}`)
                .join('\n');

            const message = `
🛵 <b>ORDER PICKED UP!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order:</b> #${orderId.toString().slice(-6).toUpperCase()}
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

💰 <b>Amount:</b> ₹${order.totalAmount} (${order.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'})
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
            const orderId = order._id || order.id || 'N/A';
            const deliveredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
            const acceptedAt = order.statusHistory?.find(h => h.status === 'shipped')?.timestamp || order.updatedAt || order.createdAt;
            const acceptedTime = new Date(acceptedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

            const message = `
✅ <b>ORDER DELIVERED!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order:</b> #${orderId.toString().slice(-6).toUpperCase()}
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

💰 <b>Amount Collected:</b> ₹${order.totalAmount} (${order.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'})
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
            console.log('[TelegramService] Preparing cancellation msg for Order:', order._id || order.id);
            
            // Helper to escape HTML characters
            const escapeHTML = (str) => {
                if (!str) return '';
                return str.toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            };

            // Robust data access
            const orderId = order._id || order.id || 'N/A';
            const customerName = escapeHTML(order.userInfo?.name || (order.shippingAddress && order.shippingAddress.fullName) || 'Guest');
            const customerPhone = escapeHTML(order.userInfo?.phone || (order.shippingAddress && order.shippingAddress.phoneNumber) || 'N/A');
            const totalAmount = order.totalAmount || 0;
            const deliveryDate = order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) : 'N/A';
            const timeSlot = escapeHTML(order.timeSlot || 'N/A');
            const safeReason = escapeHTML(reason);

            const message = `
<b>❌ ORDER CANCELLED!</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> #${orderId.toString().slice(-8).toUpperCase()}
👤 <b>Customer:</b> ${customerName}
📞 <b>Phone:</b> <code>${customerPhone}</code>

⚠️ <b>Reason:</b> <i>${safeReason}</i>

💰 <b>Amount Saved:</b> ₹${totalAmount}
📅 <b>Was Scheduled for:</b> ${deliveryDate}
⏰ <b>Slot:</b> ${timeSlot}

━━━━━━━━━━━━━━━━━━━━
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
                console.error('❌ Telegram API Error (Cancellation):', JSON.stringify(data));
            } else {
                console.log('✅ Telegram cancellation notification sent successfully');
            }
        } catch (error) {
            console.error('❌ Telegram Cancellation Notification Error:', error.message);
            console.error('Order Data Received:', JSON.stringify(order));
        }
    }
}

module.exports = TelegramService;
