import Address from '../../models/user/address.js';
import { handleResponse } from "../../utils/helper.js";
import mongoose from 'mongoose';


export const createAddress = async (req, res) => {
  const { addressType, addressLine1, addressLine2, city, state, pincode, country } = req.body;
  const userId = req.user?._id || req.body.user; 

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid or missing user ID.");
  }

  if (!addressLine1 || !city || !state || !pincode) {
    return handleResponse(res, 400, "Missing required address fields.");
  }

  try {
    const newAddress = new Address({
      user: userId,
      addressType,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country
    });

    const savedAddress = await newAddress.save();
    handleResponse(res, 201, "Address created successfully", savedAddress);
  } catch (err) {
    console.error("Create Address Error:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const getAddressById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleResponse(res, 400, "Invalid address ID.");
  }

  try {
    const address = await Address.findById(id);

    if (!address) {
      return handleResponse(res, 404, "Address not found");
    }

    handleResponse(res, 200, "Address fetched successfully", address);
  } catch (err) {
    console.error("Get Address Error:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { addressType, addressLine1, addressLine2, city, state, pincode, country } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleResponse(res, 400, "Invalid address ID.");
  }

  try {
    const updated = await Address.findByIdAndUpdate(
      id,
      {
        $set: {
          addressType,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country
        }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return handleResponse(res, 404, "Address not found");
    }

    handleResponse(res, 200, "Address updated successfully", updated);
  } catch (err) {
    console.error("Update Address Error:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const deleteAddress = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return handleResponse(res, 400, "Invalid address ID.");
  }

  try {
    const deleted = await Address.findByIdAndDelete(id);

    if (!deleted) {
      return handleResponse(res, 404, "Address not found");
    }

    handleResponse(res, 200, "Address deleted successfully", deleted);
  } catch (err) {
    console.error("Delete Address Error:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const getAllAddresses = async (req, res) => {
    const userId = req.user.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return handleResponse(res, 400, "Invalid user ID.");
  }

  try {
    const addresses = await Address.find({ user: userId }).sort({ createdAt: -1 });
    handleResponse(res, 200, "Addresses fetched successfully", addresses);
  } catch (err) {
    console.error("Get All Addresses Error:", err);
    handleResponse(res, 500, "Server error");
  }
};
