import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import ProviderService from "../../models/services/providerService.js";
import ServiceTemplate from "../../models/services/serviceTemplate.js";

export const getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id).select("-password -__v");

    if (!user) {
      return handleResponse(req, 404, "user details not found");
    }

    return handleResponse(res, 200, "User profile fetched successfully", user);
  } catch (err) {
    console.error("Create Address Error:", err);
    handleResponse(res, 500, "Server error");
  }
};

export const getAllApprovedServices = async (req, res) => {
  try {
    const services = await ProviderService.find({ isApproved: true })
      .populate("template", "name")
      .populate("provider", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTemplateNames = async (req, res) => {
  try {
    const templates = await ServiceTemplate.find({ isApproved: true }).select(
      "name"
    );

    res.status(200).json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, phone, serviceArea } = req.body;

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser && existingUser._id.toString() !== userId) {
        return res
          .status(400)
          .json({ message: "Email already in use by another account" });
      }

      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    if (req.imagePath) {
      user.profile_image = req.imagePath;
    }

   if (user.role === "provider" && serviceArea) {
    let parsedServiceArea = serviceArea;
  
    if (typeof serviceArea === 'string') {
      try {
        parsedServiceArea = JSON.parse(serviceArea);
      } catch (err) {
        return res.status(400).json({ message: "Invalid serviceArea format" });
      }
    }
  
    if (!Array.isArray(parsedServiceArea)) {
      return res
        .status(400)
        .json({ message: "serviceArea must be an array" });
    }
  
    user.serviceArea = parsedServiceArea;
  }
  

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        serviceArea: user.serviceArea,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
