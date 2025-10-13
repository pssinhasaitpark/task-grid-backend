// 📁 app/routes/media.js

import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function (app) {
  router.get('/media/:name', (req, res) => {
    const { name } = req.params;
    const filePath = path.join(__dirname, '../uploads', name);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('File not found:', err.message);
        res.status(404).json({ message: 'Media not found' });
      }
    });
  });

  app.use('/', router);
}
