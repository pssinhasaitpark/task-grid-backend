import express from "express";
import {
  createBooking,
  getInvoiceDetails,
  getMyBookings,
  razorpayWebhook,
} from "../../controllers/booking/booking.js";

import { verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createBooking);


router.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);
router.get("/my",getMyBookings)

router.get("/invoice", getInvoiceDetails);

export default router;
