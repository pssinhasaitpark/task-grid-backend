import express from "express";
import {
  createBooking,
  getInvoiceDetails,
  getMyBookings,
  razorpayWebhook,
  getBookingById,
  updateBookingStatus,
  verifyBookingOtp,
} from "../../controllers/booking/booking.js";

import { verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

router.use(verifyToken);

router.post("/", createBooking);

router.get("/my", getMyBookings);

router.get("/invoice", getInvoiceDetails);


router.post("/:id/verify-otp", verifyToken,verifyBookingOtp);


router.put("/:id/status", updateBookingStatus);

router.get("/:id", getBookingById);

export default router;
