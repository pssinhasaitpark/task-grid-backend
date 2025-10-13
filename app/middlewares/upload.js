import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { handleResponse } from '../utils/helper.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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
      

    const uploadDir = path.join(__dirname, '../uploads');


    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const filePath = path.join(uploadDir, fileName);

    try {
      await sharp(req.file.buffer)
        .resize(800)
        .webp({ quality: 80 })
        .toFile(filePath);

   
      req.imagePath = `/media/${fileName}`;
      next();
    } catch (err) {
      console.error('Image processing error:', err);
      return handleResponse(res, 500, 'Image upload failed');
    }
  },
];
