import multer from 'multer';
import { SUPPORTED_MEDIA_TYPES, MAX_FILE_SIZES } from '@our-line-in-time/shared';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allSupportedTypes = [
    ...SUPPORTED_MEDIA_TYPES.IMAGES,
    ...SUPPORTED_MEDIA_TYPES.VIDEOS,
    ...SUPPORTED_MEDIA_TYPES.AUDIO,
  ];

  if (allSupportedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

// Configure multer with limits
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(MAX_FILE_SIZES.IMAGE, MAX_FILE_SIZES.VIDEO, MAX_FILE_SIZES.AUDIO),
    files: 10, // Allow up to 10 files per request
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single('file');

// Middleware for multiple file upload
export const uploadMultiple = upload.array('files', 10);