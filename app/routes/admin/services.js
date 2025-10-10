import express from "express";
import {
  createServiceTemplate,
  getPendingServiceTemplates,
  approveServiceTemplate,
} from "../../controllers/admin/services.js";

import { verifyToken, isAdmin } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.use(verifyToken,isAdmin)

router.post("/", createServiceTemplate);

router.get("/pending", getPendingServiceTemplates);

router.put("/approve/:id", approveServiceTemplate);

export default router;
