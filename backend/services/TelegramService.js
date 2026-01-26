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
🚚 <b>Shipping:</b> ₹${order.shippingFee}
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
${order.location?.coordinates
                    ? `<a href="https://www.google.com/maps?q=${order.location.coordinates.latitude},${order.location.coordinates.longitude}">📍 View on Google Maps</a>`
                    : 'Not captured'}

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
