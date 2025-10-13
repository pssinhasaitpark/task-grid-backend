import express from "express";
import {
  createServiceTemplate,
  getPendingServiceTemplates,
  approveServiceTemplate,
} from "../../controllers/admin/services.js";

import { verifyToken, isAdmin } from "../../middlewares/jwtAuth.js";
import { uploadAndConvertImage } from "../../middlewares/upload.js";

const router = express.Router();

router.use(verifyToken,isAdmin)

router.post("/", uploadAndConvertImage('image'),createServiceTemplate);

router.get("/pending", getPendingServiceTemplates);

router.put("/approve/:id", approveServiceTemplate);

export default router;
