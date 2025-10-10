import express from 'express';
import {
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  getAllAddresses
} from '../../controllers/user/address.js';
import { verifyToken } from '../../middlewares/jwtAuth.js';


const router = express.Router();

router.use(verifyToken);

router.post('/', createAddress);
router.get('/:id', getAddressById);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.get('/', getAllAddresses);

export default router;
