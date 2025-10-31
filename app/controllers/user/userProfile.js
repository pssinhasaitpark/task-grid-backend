import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import ProviderService from "../../models/services/providerService.js";
import Availability from "../../models/user/availability.js";
export const getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id).select("-password -__v");

    if (!user) {
      return handleResponse(res, 404, "User details not found");
    }

    const userObj = user.toJSON();

    if (userObj.role !== "provider") {
      delete userObj.availableDays;
    }

    return handleResponse(
      res,
      200,
      "User profile fetched successfully",
      userObj
    );
  } catch (err) {
    console.error("Get Profile Error:", err);
    return handleResponse(res, 500, "Server error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return handleResponse(res, 404, "User not found");

    const { name, email, phone, availableDays } = req.body || {};

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser && existingUser._id.toString() !== userId) {
        return handleResponse(
          res,
          400,
          "Email already in use by another account"
        );
      }

      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

   
   
    if (req.imageUrl) {
   
      if (user.profile_image && user.profile_image.includes("res.cloudinary.com")) {
        try {
         
          const parts = user.profile_image.split("/");
          const filename = parts.pop().split(".")[0];
          const folder = parts.slice(parts.indexOf("task-grid-images")).join("/");
          const publicId = folder ? `${folder}/${filename}` : filename;

          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("⚠️ Failed to delete old profile image:", err.message);
        }
      }

    
      user.profile_image = req.imageUrl;
      
    }

   
   
    if (availableDays !== undefined) {
      if (user.role !== "provider") {
        return handleResponse(
          res,
          403,
          "Only providers can update availableDays"
        );
      }

      let parsedAvailableDays = availableDays;
      if (typeof availableDays === "string") {
        try {
          parsedAvailableDays = JSON.parse(availableDays);
        } catch (err) {
          return handleResponse(res, 400, "Invalid availableDays format");
        }
      }

      if (
        !Array.isArray(parsedAvailableDays) ||
        !parsedAvailableDays.every((day) =>
          [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ].includes(day.toLowerCase())
        )
      ) {
        return handleResponse(
          res,
          400,
          "availableDays must be an array of valid day names"
        );
      }

      user.availableDays = parsedAvailableDays.map((day) => day.toLowerCase());
    }

    await user.save();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profile_image: user.profile_image,
      isVerified: user.isVerified,
    };

    if (user.role === "provider") {
      userResponse.availableDays = user.availableDays;
    }

    return handleResponse(res, 200, "Profile updated successfully", {
      user: userResponse,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return handleResponse(res, 500, "Internal server error");
  }
};



export const getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const { templateId } = req.query; 


    const user = await User.findById(id).select(
      "_id name email phone role profile_image is_new availableDays isVerified createdAt"
    );

    if (!user) {
      return handleResponse(res, 404, "User not found");
    }


    const availability = await Availability.findOne({ user: id }).select("_id days");

  
    let providerServiceFilter = { provider: id };
    if (templateId) {
      providerServiceFilter.template = templateId; 
    }

    
    const providerServices = await ProviderService.find(providerServiceFilter)
      .populate({
        path: "template",
        select: "_id name isApproved image createdAt",
      })
      .select("_id template hourlyRate dailyRate description isApproved createdAt");

  
    const userData = {
      ...user.toObject(),
      availability: availability || null,
      services: providerServices || [],
    };

    return handleResponse(
      res,
      200,
      templateId
        ? "Specific provider service fetched successfully"
        : "User details fetched successfully",
      userData
    );
  } catch (error) {
    console.error("Get User by ID Error:", error);
    return handleResponse(res, 500, "Internal server error");
  }
};

