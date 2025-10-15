import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  days: {
    type: [String],
    enum: [
      "monday", "tuesday", "wednesday", "thursday",
      "friday", "saturday", "sunday"
    ],
    default: [],
  },
}, { timestamps: true });

const Availability = mongoose.model("Availability", AvailabilitySchema);
export default Availability;
