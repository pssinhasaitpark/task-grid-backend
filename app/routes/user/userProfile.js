import express from 'express';
import { verifyToken } from '../../middlewares/jwtAuth.js';
import { getProfile, getUserById, updateProfile } from '../../controllers/user/userProfile.js';
import { uploadAndConvertImage } from '../../middlewares/upload.js';

const router = express();

router.get("/profile", verifyToken, getProfile);

router.put("/profile", verifyToken, uploadAndConvertImage('profile_image'),updateProfile);

router.get("/:id", getUserById);


export default router;