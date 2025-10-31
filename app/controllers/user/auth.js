import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import { signAccessToken ,signResetToken,signRefreshToken} from "../../middlewares/jwtAuth.js";
import {  } from "../../middlewares/jwtAuth.js";
import jwt from "jsonwebtoken";
import {sendPasswordResetSuccessEmail  } from "../../utils/emailHandler.js";
import { generateOTP } from "../../middlewares/jwtAuth.js";
import { sendOTPEmail } from "../../utils/emailHandler.js";
import { hashOTP } from "../../middlewares/jwtAuth.js";
import { compareOTPHash } from "../../middlewares/jwtAuth.js";


export const registerUser = async (req, res) => {
  
  const { name, email, password, phone, role } = req.body;

  try {
   
    if (!["customer", "provider"].includes(role)) {
      return handleResponse(
        res,
        400,
        "Invalid role. Must be 'customer' or 'provider'"
      );
    }

    const existing = await User.findOne({ email, role });

    if (existing) {
      return handleResponse(res, 400, `User already registered as ${role}`);
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      role,
      isVerified: role === "customer" ? true : false,
    });

    await user.save();


    const message =
      role === "provider"
        ? "Registered successfully as provider."
        : "Registered successfully as customer.";


    handleResponse(res, 201, message, user);
  } catch (err) {
    console.error("Registration Error:", err);
    handleResponse(res, 500, "Server error");
  }
};


export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!["customer", "provider", "admin"].includes(role)) {
    return handleResponse(res, 400, "Invalid role");
  }

  try {
    const user = await User.findOne({ email, role });
    if (!user) {
      return handleResponse(res, 401, "Invalid email or role");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return handleResponse(res, 400, "Invalid email or password");



    const accessToken = await signAccessToken(user._id.toString(), user.role);

    const refreshToken = await signRefreshToken(user);

    return handleResponse(res, 200, "Login successful", {
      accessToken,
      refreshToken,
      role: user.role,
      is_new:user.is_new,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Server error");
  }
};


export const forgatePassword = async (req, res) => {
  try {
    const { email, role } = req.body || {};
    if (!email || !role) return handleResponse(res, 400, "Email and role are required");
    if (!["customer", "provider"].includes(role)) {
      return handleResponse(res, 400, "Invalid role");
    }

    const user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user) return handleResponse(res, 404, "User not found");


    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    user.password_reset_otp_hash = otpHash;
    user.password_reset_otp_expires = otpExpiry;
    user.password_reset_otp_attempts = 0;
    user.password_reset_otp_verified = false;
    await user.save();

    await sendOTPEmail(user.email, user.name, otp);


    return handleResponse(res, 200, "OTP sent to email");
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Internal server error");
  }
};


export const verifyResetOtp = async (req, res) => {
  try {
    const { email, role, otp } = req.body || {};
    if (!email || !role || !otp) return handleResponse(res, 400, "Email, role and otp required");
    const user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user) return handleResponse(res, 404, "User not found");

  
    if (!user.password_reset_otp_hash || !user.password_reset_otp_expires) {
      return handleResponse(res, 400, "No OTP requested");
    }

    if (user.password_reset_otp_expires < new Date()) {
      return handleResponse(res, 401, "OTP expired");
    }

    const MAX_ATTEMPTS = 5;
    if (user.password_reset_otp_attempts >= MAX_ATTEMPTS) {
      return handleResponse(res, 429, "Too many failed attempts. Request a new OTP.");
    }

    const match = await compareOTPHash(otp, user.password_reset_otp_hash);
    if (!match) {
      user.password_reset_otp_attempts = (user.password_reset_otp_attempts || 0) + 1;
      await user.save();
      return handleResponse(res, 401, "Invalid OTP");
    }


    user.password_reset_otp_verified = true;
    user.password_reset_otp_hash = null;
    user.password_reset_otp_expires = null;
    user.password_reset_otp_attempts = 0;

  
    const resetToken = await signResetToken(user.email, user.id, user.role);
    const decoded = jwt.decode(resetToken);

    user.password_reset_jti = decoded.jti;
    user.password_reset_token_expiry = new Date(decoded.exp * 1000);
    await user.save();


    return handleResponse(res, 200, "OTP verified",resetToken );
  } catch (err) {
    console.error(err);
    return handleResponse(res, 500, "Internal server error");
  }
};


export const resetPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body || {};
  const user = req.user; 

  try {
    if (!newPassword || !confirmPassword) {
      return handleResponse(res, 400, "Both password fields are required");
    }
    if (newPassword !== confirmPassword) {
      return handleResponse(res, 400, "Passwords do not match");
    }
    if (!["customer", "provider"].includes(user.role)) {
      return handleResponse(res, 403, "Admin password reset is not allowed");
    }

    user.password = newPassword;
    user.password_reset_jti = null;
    user.password_reset_token_expiry = null;
    user.password_reset_otp_verified = false; 
    await user.save();

    await sendPasswordResetSuccessEmail(user.email, user.name);
    return handleResponse(res, 200, "Password has been successfully reset");
  } catch (err) {
    console.error(err);
    return handleResponse(res, 400, err.message || "An error occurred");
  }
};


export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return handleResponse(res, 401, "No refresh token provided");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return handleResponse(res, 401, "User not found");


    if (
      user.refresh_token_jti !== decoded.jti ||
      !user.refresh_token_expiry ||
      user.refresh_token_expiry < new Date()
    ) {
      return handleResponse(res, 403, "Invalid or expired refresh token");
    }

    
    const newAccessToken = await signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = await signRefreshToken(user); // rotates and saves in DB

    return handleResponse(res, 200, "Tokens refreshed", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error(err);
    return handleResponse(res, 403, "Invalid or expired refresh token");
  }
};


export const changePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body || {};

  try {

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return handleResponse(res, 404, "User not found");
    }


    if (!oldPassword || !newPassword || !confirmPassword) {
      return handleResponse(res, 400, "All password fields are required");
    }


    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return handleResponse(res, 401, "Old password is incorrect");
    }

    if (newPassword !== confirmPassword) {
      return handleResponse(res, 400, "New passwords do not match");
    }

    if (oldPassword === newPassword) {
      return handleResponse(res, 400, "New password cannot be same as old password");
    }


    user.password = newPassword;
    await user.save();

    return handleResponse(res, 200, "Password changed successfully");
  } catch (err) {
    console.error("Change Password Error:", err);
    return handleResponse(res, 500, "Server error");
  }
};

