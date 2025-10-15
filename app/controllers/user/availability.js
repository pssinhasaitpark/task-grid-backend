import Availability from '../../models/user/availability.js';
import { handleResponse } from '../../utils/helper.js';
import mongoose from 'mongoose';

const validDays = [
  "monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday"
];


export const createOrUpdateAvailability = async (req, res) => {
  const userId = req.user?._id;
  const { days } = req.body;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid or missing user ID.");
  }

  if (!Array.isArray(days) || days.length === 0) {
    return handleResponse(res, 400, "Days must be a non-empty array.");
  }

  const normalizedDays = days.map(day => day.toLowerCase());
  const invalidDays = normalizedDays.filter(day => !validDays.includes(day));

  if (invalidDays.length > 0) {
    return handleResponse(res, 400, `Invalid day(s): ${invalidDays.join(", ")}`);
  }

  try {
    const updated = await Availability.findOneAndUpdate(
      { user: userId },
      { $set: { days: normalizedDays } },
      { new: true, upsert: true }
    );

    return handleResponse(res, 200, "Availability saved successfully", updated);
  } catch (err) {
    console.error("Save Availability Error:", err);
    return handleResponse(res, 500, "Server error");
  }
};


export const getMyAvailability = async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid or missing user ID.");
  }

  try {
    const availability = await Availability.findOne({ user: userId });

    if (!availability) {
      return handleResponse(res, 404, "Availability not set yet.");
    }

    return handleResponse(res, 200, "Your availability fetched successfully", availability);
  } catch (err) {
    console.error("Get My Availability Error:", err);
    return handleResponse(res, 500, "Server error");
  }
};


export const isUserAvailableOnDay = async (req, res) => {
  const { userId, day } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid user ID.");
  }

  const normalizedDay = day?.toLowerCase();
  if (!validDays.includes(normalizedDay)) {
    return handleResponse(res, 400, "Invalid day.");
  }

  try {
    const availability = await Availability.findOne({
      user: userId,
      days: normalizedDay
    });

    const isAvailable = !!availability;

    return handleResponse(res, 200, "Availability status fetched", { available: isAvailable });
  } catch (err) {
    console.error("Check Availability Error:", err);
    return handleResponse(res, 500, "Server error");
  }
};


export const deleteAvailability = async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid or missing user ID.");
  }

  try {
    const deleted = await Availability.findOneAndDelete({ user: userId });

    if (!deleted) {
      return handleResponse(res, 404, "No availability found to delete.");
    }

    return handleResponse(res, 200, "Availability deleted successfully", deleted);
  } catch (err) {
    console.error("Delete Availability Error:", err);
    return handleResponse(res, 500, "Server error");
  }
};
