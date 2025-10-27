import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import { sendApprovalEmail } from "../../utils/emailHandler.js";


/* 
export const approveProvider = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return handleResponse(res, 404, "User not found");
    }

    if (user.role !== "provider") {
      return handleResponse(res, 400, "Only providers can be approved");
    }

    if (user.isVerified) {
      return handleResponse(res, 400, "Provider is already verified");
    }

    user.isVerified = true;
    await user.save();

    await sendApprovalEmail(user.email, user.name);

    return handleResponse(res, 200, "Provider approved successfully", {
      id: user._id,
      name: user.name,
      email: user.email,
      serviceArea: user.serviceArea,
      isVerified: user.isVerified, // <--- added this line
    });
  } catch (error) {
    console.error(error);
    return handleResponse(res, 500, "Server error");
  }
};
 */

export const approveProvider = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return handleResponse(res, 404, "User not found");
    }

    if (user.role !== "provider") {
      return handleResponse(
        res,
        400,
        "Only providers can be approved/unapproved"
      );
    }

    user.isVerified = !user.isVerified;
    await user.save();

    if (user.isVerified) {
      await sendApprovalEmail(user.email, user.name);
    }

    return handleResponse(
      res,
      200,
      `Provider verification status updated to ${user.isVerified}`,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        serviceArea: user.serviceArea,
        isVerified: user.isVerified,
      }
    );
  } catch (error) {
    console.error(error);
    return handleResponse(res, 500, "Server error");
  }
};

export const getUnapprovedProviders = async (req, res) => {
  try {
    const providers = await User.find({
      role: "provider",
    }).select("name email phone serviceArea createdAt isVerified");

    return handleResponse(
      res,
      200,
      "Unapproved providers fetched successfully",
      providers
    );
  } catch (error) {
    console.error("Error fetching unapproved providers:", error);
    return handleResponse(res, 500, "Server error");
  }
};



