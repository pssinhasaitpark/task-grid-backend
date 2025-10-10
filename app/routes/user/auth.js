import express from 'express';
import { forgatePassword, loginUser, registerUser, resetPassword, verifyResetOtp } from '../../controllers/user/auth.js';
import { verifyResetToken, verifyRole } from '../../middlewares/jwtAuth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser, verifyRole);


router.post("/forgot-password", forgatePassword);


router.post("/reset-password", verifyResetToken, resetPassword);


router.post("/verify-reset-otp", verifyResetOtp);


export default router;
