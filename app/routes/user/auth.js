import express from "express";
import {
  changePassword,
  forgatePassword,
  loginUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  verifyResetOtp,
} from "../../controllers/user/auth.js";
import { verifyResetToken, verifyRole, verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser, verifyRole);

router.post("/forgot-password", forgatePassword);

router.post("/reset-password", verifyResetToken, resetPassword);

router.post("/refresh-token", refreshAccessToken);

router.post("/verify-reset-otp", verifyResetOtp);

router.post('/change-password', verifyToken, changePassword);

export default router;
