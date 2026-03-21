const Complaint = require('../models/Complaint');
const { cloudinary } = require('../services/cloudinary');

// Create a new complaint
exports.createComplaint = async (req, res) => {
    try {
        const { userId, orderId, displayOrderId, itemName, issueType, description } = req.body;

        if (!req.files || req.files.length !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Exactly two photos are required'
            });
        }

        if (!description || description.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 20 characters'
            });
        }

        // Map files to Cloudinary URLs
        const photos = req.files.map(file => file.path);

        const complaint = new Complaint({
            user: userId,
            orderId,
            displayOrderId,
            itemName,
            issueType,
            description,
            photos,
            status: 'Pending'
        });

        await complaint.save();

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            complaint
        });
    } catch (error) {
        console.error('Create Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating complaint'
        });
    }
};

// Get complaints for a specific user
exports.getUserComplaints = async (req, res) => {
    try {
        const { userId } = req.params;
        const User = require('../models/User');

        console.log('🔍 Fetching complaints for user:', userId);

        // Smart ID lookup to handle both MongoDB _id and googleId
        const user = await User.findOne({
            $or: [
                { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
                { googleId: userId }
            ].filter(q => (q._id !== null && q._id !== undefined) || q.googleId !== undefined)
        });

        const userIds = [userId];
        if (user) {
            if (user._id) userIds.push(user._id.toString());
            if (user.googleId) userIds.push(user.googleId);
        }

        const uniqueUserIds = [...new Set(userIds.filter(id => id))];
        const complaints = await Complaint.find({ user: { $in: uniqueUserIds } }).sort({ createdAt: -1 });

        res.json({
            success: true,
            complaints
        });
    } catch (error) {
        console.error('Get User Complaints Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching complaints'
        });
    }
};

// Admin: Get all complaints
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('orderId')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            complaints
        });
    } catch (error) {
        console.error('Get All Complaints Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching all complaints'
        });
    }
};

// Admin: Update complaint status and notes
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, resolutionType } = req.body;

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Only admin can change status
        if (status) {
            // Validate status transitions if necessary
            complaint.status = status;
            complaint.statusChangedAt = Date.now();

            if (status === 'Resolved') {
                complaint.resolvedAt = Date.now();
            }
        }

        if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
        if (resolutionType !== undefined) complaint.resolutionType = resolutionType;

        await complaint.save();
        res.json({
            success: true,
            message: 'Complaint updated successfully',
            complaint
        });
    } catch (error) {
        console.error('Update Complaint Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating complaint'
        });
    }
};

// Admin: Delete a resolved complaint
exports.deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        if (complaint.status !== 'Resolved') {
            return res.status(400).json({
                success: false,
                message: 'Only resolved complaints can be deleted'
            });
        }

        // Delete associated photos from Cloudinary
        for (const photoUrl of complaint.photos) {
            try {
                // Extract public_id from URL
                // Example URL: https://res.cloudinary.com/demo/image/upload/v12345/rgbasket-complaints/filename.webp
                const parts = photoUrl.split('/');
                const folderAndFile = parts.slice(-2).join('/'); // rgbasket-complaints/filename.webp
                const publicId = folderAndFile.split('.')[0]; // rgbasket-complaints/filename

                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error('Cloudinary deletion error:', err);
            }
        }

        await Complaint.findByIdAndDelete(id);
        res.json({
            success: true,
            message: 'Complaint and associated photos deleted successfully'
        });
    } catch (error) {
        console.error('Delete Complaint Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting complaint'
        });
    }
};
