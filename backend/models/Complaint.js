const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    user: {
        type: String, // String to match existing user ID format (googleId or MongoDB _id)
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    displayOrderId: { // Added for easier display to user if needed
        type: String,
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    issueType: {
        type: String,
        required: true,
        enum: [
            'Damaged/Rotten Product',
            'Wrong/Missing Item',
            'Delivery Problem',
            'Pricing/Billing Issue',
            'Suggestion/Feedback',
            'Other'
        ]
    },
    description: {
        type: String,
        required: true,
        minlength: 20
    },
    photos: {
        type: [String],
        validate: [v => v.length === 2, 'Exactly two photos are required'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Investigating', 'Resolved'],
        default: 'Pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    resolutionType: {
        type: String,
        default: ''
    },
    statusChangedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Complaint', ComplaintSchema);
