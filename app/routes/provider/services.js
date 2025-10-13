import express from 'express';
import {
createProviderService,createTemplateRequest,getMyServiceRequests,
getMyServices
} from '../../controllers/provider/services.js';

import { verifyToken, isAdmin } from '../../middlewares/jwtAuth.js';
import { uploadAndConvertImage } from '../../middlewares/upload.js';

const router = express.Router();


router.post('/request',verifyToken,uploadAndConvertImage('image'),createTemplateRequest);

router.post('/', verifyToken, createProviderService);

router.get('/my', verifyToken, getMyServices);


export default router;
