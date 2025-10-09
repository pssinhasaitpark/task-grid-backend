import express from 'express';
import {
  createServiceTemplate,
  getPendingServiceTemplates,
  approveServiceTemplate
} from '../../controllers/admin/services.js';

import { verifyToken, isAdmin } from '../../middlewares/jwtAuth.js';

const router = express.Router();

router.post('/', verifyToken, isAdmin, createServiceTemplate);

router.get('/pending', verifyToken, isAdmin, getPendingServiceTemplates);

router.patch('/approve/:id', verifyToken, isAdmin, approveServiceTemplate);

export default router;
