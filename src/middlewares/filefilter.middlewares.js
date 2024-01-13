const storage = multer.memoryStorage()
const fileFilter = (req, file, cb) => {

  const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedFormats.includes(file.mimetype)) {
    return cb(new Error('Invalid file format. Please upload an image.'));
  }

  const maxSize = 1024 * 1024; // 1 MB in bytes
  if (file.size > maxSize) {
    return cb(new Error('File size exceeds the limit of 1 MB.'));
  }

  cb(null, true);
};