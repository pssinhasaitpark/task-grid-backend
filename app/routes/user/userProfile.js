import express from 'express';
import { verifyToken } from '../../middlewares/jwtAuth.js';
import { getProfile, updateProfile } from '../../controllers/user/userProfile.js';

const router = express();

router.get("/profile", verifyToken, getProfile);

router.put("/profile",verifyToken,updateProfile)

export default router;