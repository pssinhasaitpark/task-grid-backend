import express from 'express';

const router = express.Router();
import { verifyToken, isAdmin } from "../../middlewares/jwtAuth.js";
import { getAllCustomers } from '../../controllers/admin/customer.js';

router.use(verifyToken, isAdmin);

router.get('/customers', getAllCustomers);

export default router;