import express from "express";
import * as availabilityController from "../../controllers/user/availability.js";
import { verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", availabilityController.createAvailability);
router.get("/my", availabilityController.getMyAvailability);
router.get("/:id", availabilityController.getAvailabilityById);
router.put("/:id", availabilityController.updateAvailability);
router.delete("/:id", availabilityController.deleteAvailability);

export default router;
