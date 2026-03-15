const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rgbasket-products',
    format: async (req, file) => {
      // Convert all images to WebP for better compression
      return 'webp';
    },
    transformation: [
      {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  },
});

const complaintStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rgbasket-complaints',
  },
});

const riderStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rgbasket-riders',
    format: async (req, file) => 'webp',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  },
});

const proofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rgbasket-delivery-proof',
    format: async (req, file) => 'webp',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  },
});

const deleteFromCloudinary = async (url) => {
  if (!url || !url.includes('cloudinary')) return;
  try {
    // Extract public_id: everything after /upload/v.../ and before the extension
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return;

    // Skip the 'upload' and the 'version' (v123456)
    const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExt.split('.')[0];

    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Cloudinary resource deleted:', publicId);
  } catch (error) {
    console.error('❌ Cloudinary deletion error:', error);
  }
};

module.exports = { cloudinary, storage, complaintStorage, riderStorage, proofStorage, deleteFromCloudinary };