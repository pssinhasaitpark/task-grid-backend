import multer from 'multer';
import sharp from 'sharp';
import { handleResponse } from '../utils/helper.js';
import cloudinary from '../config/cloudinary.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});


export const uploadAndConvertImage = (fieldName) => [
  upload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();

    try {
   
      const buffer = await sharp(req.file.buffer)
        .resize(800) 
        .webp({ quality: 80 })
        .toBuffer();

     
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'task-grid-images',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });

   
      req.imageUrl = uploadResult.secure_url;
      req.cloudinaryPublicId = uploadResult.public_id;
      next();
    } catch (err) {
      console.error('Image upload error:', err);
      return handleResponse(res, 500, 'Image upload failed');
    }
  },
];
