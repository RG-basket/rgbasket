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
    // Removed format and transformation to keep original full quality
  },
});

module.exports = { cloudinary, storage, complaintStorage };