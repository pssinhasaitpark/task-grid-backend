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
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "in-progress", "completed"],
    default: "pending",
  },
  otp: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  amount: {
    type: Number,
    required: true,
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
