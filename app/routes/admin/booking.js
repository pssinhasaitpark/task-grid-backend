import express from "express"
const router = express.Router();

import { getAllBookings } from "../../controllers/admin/booking.js";
import { verifyToken, isAdmin } from "../../middlewares/jwtAuth.js";


router.use(verifyToken, isAdmin);

router.get("/", getAllBookings);

export default router;