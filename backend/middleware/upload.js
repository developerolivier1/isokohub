const multer = require('multer');
const path = require('path');
const { AppError } = require('./error');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4', 'video/webm',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed.`, 400, 'INVALID_FILE_TYPE'), false);
  }
};

const uploadLocal = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter,
});

const uploadSingleImage = uploadLocal.single('image');
const uploadMultipleImages = uploadLocal.array('images', 10);
const uploadFields = uploadLocal.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'document', maxCount: 5 },
  { name: 'video', maxCount: 1 },
]);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 5MB.', 400, 'FILE_TOO_LARGE'));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files.', 400, 'TOO_MANY_FILES'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError(`Unexpected file field: ${err.field}`, 400, 'UNEXPECTED_FILE'));
    }
    return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
  }
  next(err);
};

module.exports = {
  uploadLocal,
  uploadSingleImage,
  uploadMultipleImages,
  uploadFields,
  handleUploadError,
};
