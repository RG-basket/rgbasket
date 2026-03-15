const mongoose = require('mongoose');

const DeliveryPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    altPhone: {
        type: String,
        default: ''
    },
    aadharCardLink: {
        type: String,
        default: ''
    },
    drivingLicenseLink: {
        type: String,
        default: ''
    },
    vehicleRcLink: {
        type: String,
        default: ''
    },
    vehiclePlateNumber: {
        type: String,
        default: ''
    },
    paymentPhone: {
        type: String,
        default: ''
    },
    upiId: {
        type: String,
        default: ''
    },
    bankDetails: {
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' },
        accountHolderName: { type: String, default: '' }
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    loginPin: {
        type: String,
        required: true
    },
    portalToken: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    liveLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastPing: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryPartner', DeliveryPartnerSchema);
