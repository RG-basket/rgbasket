const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const crypto = require('crypto');

// --- ADMIN ENDPOINTS ---

// Create a new delivery partner
exports.createPartner = async (req, res) => {
    try {
        const {
            name, phone, altPhone, vehiclePlateNumber,
            paymentPhone, upiId, bankDetails, loginPin, joinDate
        } = req.body;

        // Check if phone already exists
        const existing = await DeliveryPartner.findOne({ phone });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }

        const portalToken = crypto.randomBytes(16).toString('hex');

        // Handle File Uploads
        const aadharCardLink = req.files?.aadharCard ? req.files.aadharCard[0].path : '';
        const drivingLicenseLink = req.files?.drivingLicense ? req.files.drivingLicense[0].path : '';
        const vehicleRcLink = req.files?.vehicleRc ? req.files.vehicleRc[0].path : '';

        // Parse bank details if sent as string (multer/form-data)
        let parsedBankDetails = {};
        if (bankDetails) {
            try {
                parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
            } catch (e) {
                console.error('Error parsing bank details:', e);
            }
        }

        const newPartner = new DeliveryPartner({
            name,
            phone,
            altPhone,
            aadharCardLink,
            drivingLicenseLink,
            vehicleRcLink,
            vehiclePlateNumber,
            paymentPhone,
            upiId,
            bankDetails: parsedBankDetails,
            joinDate: joinDate || Date.now(),
            loginPin,
            portalToken
        });

        await newPartner.save();

        res.status(201).json({
            success: true,
            message: 'Delivery Partner created successfully',
            partner: newPartner
        });
    } catch (error) {
        console.error('Error creating delivery partner:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get all delivery partners with their stats (Delivered count, Revenue, Current Orders)
exports.getAllPartners = async (req, res) => {
    try {
        const partners = await DeliveryPartner.find().sort({ createdAt: -1 }).lean();

        // Enhance partners with order stats
        const enhancedPartners = await Promise.all(partners.map(async (p) => {
            // Get Delivered Stats
            const deliveredStats = await Order.aggregate([
                { $match: { deliveryPartner: p._id, status: 'delivered' } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalRevenue: { $sum: '$totalAmount' }
                    }
                }
            ]);

            // Get Current Active Orders
            const activeOrders = await Order.find({
                deliveryPartner: p._id,
                status: { $in: ['shipped', 'processing', 'confirmed'] }
            }).select('_id totalAmount status createdAt userInfo shippingAddress').lean();

            return {
                ...p,
                stats: {
                    deliveredCount: deliveredStats[0]?.count || 0,
                    totalEarnings: deliveredStats[0]?.totalRevenue || 0,
                    activeOrdersCount: activeOrders.length
                },
                currentOrders: activeOrders
            };
        }));

        res.json({ success: true, partners: enhancedPartners });
    } catch (error) {
        console.error('Error fetching partners with stats:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const { deleteFromCloudinary } = require('../services/cloudinary');

// Admin: Delete proof of delivery image link from order
exports.deleteProof = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Physical deletion to save storage
        if (order.proofOfDelivery?.image) {
            await deleteFromCloudinary(order.proofOfDelivery.image);
        }

        order.proofOfDelivery = {
            image: '',
            capturedAt: null,
            location: order.proofOfDelivery?.location, // Keep location for audit? 
            isForcefullyDelivered: order.proofOfDelivery?.isForcefullyDelivered
        };
        await order.save();

        res.json({ success: true, message: 'Proof of delivery image removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update partner status (active/inactive) or other details (admin)
exports.updatePartner = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const updateData = req.body;

        const partner = await DeliveryPartner.findByIdAndUpdate(partnerId, updateData, { new: true });

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }
        res.json({ success: true, partner });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Delete partner
exports.deletePartner = async (req, res) => {
    try {
        const { partnerId } = req.params;
        await DeliveryPartner.findByIdAndDelete(partnerId);
        res.json({ success: true, message: 'Partner deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Admin manually assign order to rider
exports.assignOrder = async (req, res) => {
    try {
        const { orderId, partnerId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const partner = await DeliveryPartner.findById(partnerId);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });

        order.deliveryPartner = partnerId;
        order.status = 'shipped';

        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status: 'shipped',
            timestamp: new Date(),
            comment: `Assigned to Rider: ${partner.name} by Admin`
        });

        await order.save();

        res.json({ success: true, message: 'Order assigned successfully', order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


// --- RIDER ENDPOINTS ---

// Login logic using portalToken and PIN
exports.riderLogin = async (req, res) => {
    try {
        const { portalToken, loginPin } = req.body;
        const partner = await DeliveryPartner.findOne({ portalToken, loginPin });
        if (!partner) {
            return res.status(401).json({ success: false, message: 'Invalid token or PIN' });
        }
        if (!partner.isActive) {
            return res.status(403).json({ success: false, message: 'Account is inactive. Contact admin.' });
        }

        // Create simple token response for frontend auth
        // Note: Since this is purely PIN based with no JWT or complex session required as per user's "just simple pin", 
        // sending back partner ID is enough for the client to store in session storage.
        res.json({ success: true, partner });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get available orders to accept 
// Assuming orders that are 'confirmed' or 'processing' and have no deliveryPartner assigned
exports.getAvailableOrders = async (req, res) => {
    try {
        const { partnerId } = req.params; // To verify partner exists
        const partner = await DeliveryPartner.findById(partnerId);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
        if (!partner.isActive) return res.status(403).json({ success: false, message: 'Inactive partner' });

        const orders = await Order.find({
            status: { $in: ['confirmed', 'processing'] },
            deliveryPartner: null
        }).sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Accept an order
exports.acceptOrder = async (req, res) => {
    try {
        const { partnerId, orderId } = req.body;

        const partner = await DeliveryPartner.findById(partnerId);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
        if (!partner.isActive) return res.status(403).json({ success: false, message: 'Inactive partner' });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        if (order.deliveryPartner) {
            return res.status(400).json({ success: false, message: 'Order already accepted by another rider' });
        }

        order.deliveryPartner = partnerId;
        order.status = 'shipped'; // User specified changing to shipped/out for delivery

        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status: 'shipped',
            timestamp: new Date(),
            comment: 'Accepted by Delivery Partner'
        });

        await order.save();

        res.json({ success: true, message: 'Order accepted successfully', order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get orders assigned to the rider
exports.getMyOrders = async (req, res) => {
    try {
        const { partnerId } = req.params;

        const records = await Order.find({ deliveryPartner: partnerId })
            .select('userInfo shippingAddress items status subtotal shippingFee tax discountAmount tipAmount totalAmount paymentMethod deliveryLocation liveLocation createdAt instruction')
            .sort({ updatedAt: -1 });

        res.json({ success: true, orders: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Mark order as delivered (with optional proof image)
exports.completeOrder = async (req, res) => {
    try {
        const { orderId, partnerId, latitude, longitude, isForcefullyDelivered } = req.body;

        const order = await Order.findOne({ _id: orderId, deliveryPartner: partnerId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });

        if (order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Order already delivered' });
        }

        order.status = 'delivered';
        order.deliveredAt = new Date();

        // If delivery spot was missing, capture it now for future deliveries
        if (!order.deliveryLocation?.coordinates?.latitude && latitude && longitude) {
            order.deliveryLocation = {
                coordinates: { latitude, longitude },
                source: 'live',
                timestamp: new Date()
            };
        }

        // Initialize proof object with audit data even if image is missing
        order.proofOfDelivery = {
            image: req.file ? req.file.path : (order.proofOfDelivery?.image || ''),
            capturedAt: new Date(),
            location: latitude && longitude ? { latitude, longitude } : (order.proofOfDelivery?.location || undefined),
            isForcefullyDelivered: isForcefullyDelivered === 'true' || isForcefullyDelivered === true
        };

        order.statusHistory = order.statusHistory || [];
        order.statusHistory.push({
            status: 'delivered',
            timestamp: new Date(),
            comment: isForcefullyDelivered === 'true' || isForcefullyDelivered === true
                ? 'Marked as delivered by Rider (FORCEFULLY - OUTSIDE GEOFENCE)'
                : 'Marked as delivered by Rider'
        });

        await order.save();

        res.json({ success: true, message: 'Order marked as delivered', order });
    } catch (error) {
        console.error('Error completing order:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Update Rider's Live Location (Heartbeat)
exports.updateLivePing = async (req, res) => {
    try {
        const { partnerId, latitude, longitude } = req.body;
        if (!partnerId) return res.status(400).json({ success: false, message: 'Missing Partner ID' });

        await DeliveryPartner.findByIdAndUpdate(partnerId, {
            'liveLocation.latitude': latitude,
            'liveLocation.longitude': longitude,
            'liveLocation.lastPing': new Date()
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update heartbeat' });
    }
};

// Update order delivery location (Capture live location)
exports.updateOrderLocation = async (req, res) => {
    try {
        const { orderId, partnerId, latitude, longitude, accuracy } = req.body;

        const order = await Order.findOne({ _id: orderId, deliveryPartner: partnerId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.deliveryLocation = {
            coordinates: { latitude, longitude },
            accuracy,
            timestamp: new Date(),
            source: 'live' // Rider captured live
        };

        await order.save();

        res.json({ success: true, message: 'Location captured successfully', deliveryLocation: order.deliveryLocation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Fetch previous delivery location for the same user if current is empty
exports.getCustomerLocationHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the most recent order for this user that HAS a delivery location with coordinates
        const previousOrder = await Order.findOne({
            user: userId,
            'deliveryLocation.coordinates.latitude': { $ne: null },
            'deliveryLocation.coordinates.longitude': { $ne: null }
        }).sort({ createdAt: -1 });

        if (!previousOrder) {
            return res.json({ success: false, message: 'No historical location found' });
        }

        res.json({
            success: true,
            deliveryLocation: previousOrder.deliveryLocation,
            orderId: previousOrder._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Rider toggle their own active status
exports.toggleStatus = async (req, res) => {
    try {
        const { partnerId } = req.params;
        const { isActive } = req.body;
        const partner = await DeliveryPartner.findByIdAndUpdate(partnerId, { isActive }, { new: true });

        res.json({ success: true, partner });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
