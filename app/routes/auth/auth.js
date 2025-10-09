import express from 'express';
import { loginUser, registerUser } from '../../controllers/auth/auth.js';
import { verifyRole } from '../../middlewares/jwtAuth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login',loginUser,verifyRole)

export default router;
