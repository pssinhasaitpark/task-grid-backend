import express from "express";
import {
  createServiceTemplate,
  getAllServiceTemplates,
  approveServiceTemplate,
  getServiceTemplateById,
  updateServiceTemplate,
  deleteServiceTemplate,
} from "../../controllers/admin/services.js";

import { verifyToken, isAdmin } from "../../middlewares/jwtAuth.js";
import { uploadAndConvertImage } from "../../middlewares/upload.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

router.post("/", uploadAndConvertImage("image"), createServiceTemplate);

router.get("/", getAllServiceTemplates);

router.put("/approve/:id", approveServiceTemplate);

router.get("/:id", getServiceTemplateById);

router.put("/:id", uploadAndConvertImage("image"),updateServiceTemplate);

router.delete("/:id", deleteServiceTemplate);

export default router;
