const multer = require('multer');
const { complaintStorage } = require('../services/cloudinary');

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG files are allowed!'), false);
    }
};

const upload = multer({
    storage: complaintStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const uploadComplaintPhotos = upload.array('photos', 2);

module.exports = { uploadComplaintPhotos };
