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
                .map(item => `  • ${item.name} (${item.weight}${item.unit}) x${item.quantity}`)
                .join('\n');

            const message = `
<b>📦 NEW ORDER PLACED!</b>
----------------------------
🆔 <b>Order ID:</b> #${order._id.toString().slice(-6).toUpperCase()}
👤 <b>Customer:</b> ${order.userInfo?.name || 'Guest'}
📞 <b>Phone:</b> ${order.userInfo?.phone || order.shippingAddress?.phoneNumber || 'N/A'}

<b>🛒 Items:</b>
${itemsText}

💰 <b>Subtotal:</b> ₹${order.subtotal}
🚚 <b>Shipping:</b> ₹${order.shippingFee}
🏷️ <b>Discount:</b> -₹${order.discountAmount}
✨ <b>Total Amount:</b> ₹${order.totalAmount}

🎁 <b>Free Gift:</b> ${order.selectedGift || 'None'}

📅 <b>Delivery Date:</b> ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
⏰ <b>Time Slot:</b> ${order.timeSlot}

📍 <b>Address:</b>
${order.shippingAddress.street}, ${order.shippingAddress.locality}
${order.shippingAddress.city}, ${order.shippingAddress.pincode}
${order.shippingAddress.landmark ? `Landmark: ${order.shippingAddress.landmark}` : ''}

📝 <b>Instruction:</b> ${order.instruction || 'None'}

📍 <b>GPS Location:</b>
${order.location?.coordinates
                    ? `<a href="https://www.google.com/maps?q=${order.location.coordinates.latitude},${order.location.coordinates.longitude}">View on Google Maps</a>`
                    : 'Not captured'}
----------------------------
✅ <b>Status:</b> ${order.status.toUpperCase()}
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
}

module.exports = TelegramService;
