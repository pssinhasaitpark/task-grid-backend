import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProviderService",
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },

  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
  bookingStatus: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "started", "completed"],
    default: "pending",
  },
  otp: {
    type: String,
    default: null,
  },
  isOtpVerified: {
    type: Boolean,
    default: false,
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  amount: {
    type: Number,
    required: true,
  },
  razorpayOrderId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

bookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
