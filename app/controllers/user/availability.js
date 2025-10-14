import Availability from '../../models/user/availability.js';
import { handleResponse } from "../../utils/helper.js";
import mongoose from 'mongoose';



export const createAvailability = async (req, res) => {
    const user = req.user?._id;
    const { days } = req.body;  
  
    if (!user || !mongoose.Types.ObjectId.isValid(user)) {
      return handleResponse(res, 400, "Invalid or missing user ID.");
    }
  
    const validDays = [
      "monday", "tuesday", "wednesday", "thursday",
      "friday", "saturday", "sunday"
    ];
  
    if (!days || !Array.isArray(days) || days.length === 0) {
      return handleResponse(res, 400, "Invalid or missing days array.");
    }
  
    const invalidDays = days.filter(day => !validDays.includes(day.toLowerCase()));
    if (invalidDays.length > 0) {
      return handleResponse(res, 400, `Invalid day(s): ${invalidDays.join(", ")}`);
    }
  
    try {
      const existing = await Availability.find({ 
        user, 
        day: { $in: days.map(d => d.toLowerCase()) } 
      }).select("day");
  
      const existingDays = existing.map(e => e.day);
  
      const newDays = days
        .map(d => d.toLowerCase())
        .filter(d => !existingDays.includes(d));
  
      if (newDays.length === 0) {
        return handleResponse(res, 400, "Availability already exists for all these days.");
      }
  
      const toInsert = newDays.map(day => ({ user, day }));
      const savedAvailabilities = await Availability.insertMany(toInsert);
  
      handleResponse(res, 201, "Availability created successfully", savedAvailabilities);
    } catch (err) {
      console.error("Create Availability Error:", err);
      handleResponse(res, 500, "Server error");
    }
};
  

export const getAvailabilityById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleResponse(res, 400, "Invalid availability ID.");
  }

  try {
    const availability = await Availability.findById(id).populate("user", "name email");

    if (!availability) {
      return handleResponse(res, 404, "Availability not found.");
    }

    handleResponse(res, 200, "Availability fetched successfully", availability);
  } catch (err) {
    console.error("Get Availability Error:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const getMyAvailability = async (req, res) => {
    const userId = req.user?._id;
  
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return handleResponse(res, 400, "Invalid or missing user ID.");
    }
  
    try {
     
      const availabilities = await Availability.find({ user: userId }).sort({ day: 1 });
  
      handleResponse(res, 200, "Your availability fetched successfully", availabilities);
    } catch (err) {
      console.error("Get My Availability Error:", err);
      handleResponse(res, 500, "Server error");
    }
};
  

export const updateAvailability = async (req, res) => {
    const { id } = req.params;
    const { day } = req.body;
  
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return handleResponse(res, 400, "Invalid availability ID.");
    }
  
    const validDays = [
      "monday", "tuesday", "wednesday", "thursday",
      "friday", "saturday", "sunday"
    ];
  
    if (!day || !validDays.includes(day.toLowerCase())) {
      return handleResponse(res, 400, "Invalid or missing day.");
    }
  
    try {
      const availability = await Availability.findById(id);
      if (!availability) {
        return handleResponse(res, 404, "Availability not found.");
      }
  
      const duplicate = await Availability.findOne({ 
        user: availability.user, 
        day: day.toLowerCase(),
        _id: { $ne: id }
      });
  
      if (duplicate) {
        return handleResponse(res, 400, "Another availability already exists for this day.");
      }
  
      availability.day = day.toLowerCase();
      const updated = await availability.save();
  
      handleResponse(res, 200, "Availability updated successfully", updated);
    } catch (err) {
      console.error("Update Availability Error:", err);
      handleResponse(res, 500, "Server error");
    }
};
  



export const deleteAvailability = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleResponse(res, 400, "Invalid availability ID.");
  }

  try {
    const deleted = await Availability.findByIdAndDelete(id);

    if (!deleted) {
      return handleResponse(res, 404, "Availability not found.");
    }

    handleResponse(res, 200, "Availability deleted successfully", deleted);
  } catch (err) {
    console.error("Delete Availability Error:", err);
    handleResponse(res, 500, "Server error");
  }
};
