import express from 'express';
import {
createProviderService,createTemplateRequest,deleteProviderService,getMyServiceRequests,
getMyServices,
getServicesByTemplate,
updateProviderService
} from '../../controllers/user/services.js';

import { verifyToken, isAdmin } from '../../middlewares/jwtAuth.js';
import { uploadAndConvertImage } from '../../middlewares/upload.js';
import { getAllApprovedServices, getAllTemplateNames } from '../../controllers/user/services.js';

const router = express.Router();


router.post('/request',verifyToken,uploadAndConvertImage('image'),createTemplateRequest);

router.post('/', verifyToken, createProviderService);

router.get('/my', verifyToken, getMyServices);


router.put('/:id', verifyToken, updateProviderService);

router.delete('/:id', verifyToken, deleteProviderService);

router.get("/", getAllApprovedServices);

router.get("/names", getAllTemplateNames);

router.get('/by-template/:templateId', getServicesByTemplate);




export default router;
