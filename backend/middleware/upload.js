const multer = require('multer');
const { storage } = require('../services/cloudinary');

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage, // Now using Cloudinary storage
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

// Middleware for handling multiple images
const uploadProductImages = upload.array('images', 5);
const uploadBannerImage = upload.single('image');
const uploadMultipleBanners = upload.array('images', 10);

module.exports = { uploadProductImages, uploadBannerImage, uploadMultipleBanners };