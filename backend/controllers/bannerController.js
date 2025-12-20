const Banner = require('../models/Banner');
const { cloudinary } = require('../services/cloudinary');

// Get all active banners
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.json({
            success: true,
            banners
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching banners'
        });
    }
};

// Admin: Get all banners (including inactive)
exports.getAllBannersAdmin = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1 });
        res.json({
            success: true,
            banners
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching banners'
        });
    }
};

// Admin: Create a new banner
exports.createBanner = async (req, res) => {
    try {
        const bannerData = req.body;

        if (req.file) {
            bannerData.imageUrl = req.file.path;
        } else if (!bannerData.imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        const banner = new Banner(bannerData);
        await banner.save();

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            banner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating banner'
        });
    }
};

// Admin: Update a banner
exports.updateBanner = async (req, res) => {
    try {
        const bannerData = req.body;
        const bannerId = req.params.id;

        if (req.file) {
            // If new image is uploaded, delete old one from Cloudinary
            const oldBanner = await Banner.findById(bannerId);
            if (oldBanner && oldBanner.imageUrl) {
                try {
                    const urlParts = oldBanner.imageUrl.split('/');
                    const filename = urlParts[urlParts.length - 1];
                    const publicId = filename.split('.')[0];
                    await cloudinary.uploader.destroy(`rgbasket-products/${publicId}`);
                } catch (deleteError) {
                    console.error('Error deleting old banner image:', deleteError);
                }
            }
            bannerData.imageUrl = req.file.path;
        }

        const banner = await Banner.findByIdAndUpdate(bannerId, bannerData, {
            new: true,
            runValidators: true
        });

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            message: 'Banner updated successfully',
            banner
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Error updating banner'
        });
    }
};

// Admin: Delete a banner
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Delete image from Cloudinary
        if (banner.imageUrl) {
            try {
                const urlParts = banner.imageUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                const publicId = filename.split('.')[0];
                await cloudinary.uploader.destroy(`rgbasket-products/${publicId}`);
            } catch (deleteError) {
                console.error('Error deleting banner image:', deleteError);
            }
        }

        await Banner.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting banner'
        });
    }
};

// Admin: Reorder banners
exports.reorderBanners = async (req, res) => {
    try {
        const { bannerIds } = req.body; // Array of IDs in new order

        const bulkOps = bannerIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index }
            }
        }));

        await Banner.bulkWrite(bulkOps);

        res.json({
            success: true,
            message: 'Banners reordered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reordering banners'
        });
    }
};

// Admin: Create multiple banners (Batch upload)
exports.createMultipleBanners = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images uploaded'
            });
        }

        const banners = [];
        const lastBanner = await Banner.findOne().sort({ order: -1 });
        let startOrder = lastBanner ? lastBanner.order + 1 : 0;

        for (const file of req.files) {
            const banner = new Banner({
                imageUrl: file.path,
                altText: 'RG Basket Banner',
                order: startOrder++
            });
            await banner.save();
            banners.push(banner);
        }

        res.status(201).json({
            success: true,
            message: `${banners.length} banners created successfully`,
            banners
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating banners'
        });
    }
};
