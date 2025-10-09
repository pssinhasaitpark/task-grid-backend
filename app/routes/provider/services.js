// routes/serviceTemplateRoutes.js
import express from 'express';
import {
  createServiceTemplate,
  requestNewServiceTemplate
} from '../controllers/serviceTemplateController.js';

import { verifyToken, isAdmin } from '../middlewares/jwtAuth.js';

const router = express.Router();


router.post('/request', verifyToken, requestNewServiceTemplate);

router.post('/', verifyToken, isAdmin, createServiceTemplate);


export default router;
