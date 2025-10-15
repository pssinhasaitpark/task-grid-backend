import express from "express";
import * as availabilityController from "../../controllers/user/availability.js";
import { verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();



router.use(verifyToken);

router.post("/", availabilityController.createOrUpdateAvailability);

router.get("/my", availabilityController.getMyAvailability);

router.delete("/", availabilityController.deleteAvailability);


router.get("/check", availabilityController.isUserAvailableOnDay);



export default router;
