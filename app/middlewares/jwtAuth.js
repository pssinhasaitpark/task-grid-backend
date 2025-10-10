import User from "../models/user/user.js";
import jwt from "jsonwebtoken";
import { handleResponse } from "../utils/helper.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

export const signResetToken = (email, id, role) => {
  const jti = uuidv4();
  const payload = { email, id, role, jti };

  const options = {
    subject: `${id}`,
    expiresIn: "5m",
  };

  return new Promise((resolve, reject) => {
    jwt.sign(payload, process.env.RESET_TOKEN_SECRET, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
};



export const signAccessToken = (id, role) => {
  return generateToken(id, role, process.env.ACCESS_TOKEN_SECRET);
};

export const generateToken = (
  id,
  role,
  secret,
  expiresIn = process.env.EXPIREIN || "1d"
) => {
  return new Promise((resolve, reject) => {
    const payload = { id, role };
    const options = {
      subject: `${id}`,
      expiresIn,
    };

    jwt.sign(payload, secret, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
};

export const verifyToken = async (req, res, next) => {
  let token =
    req.headers.authorization || req.headers["x-auth-token"] || req.query.token;

  if (!token) {
    return handleResponse(res, 401, "No token provided");
  }

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return handleResponse(res, 401, "Invalid or expired token");
    }

    req.user = user;
    next();
  } catch (err) {
    return handleResponse(res, 401, "Invalid or expired token");
  }
};

export const verifyResetToken = async (req, res, next) => {
  let token =
    req.headers.authorization || req.headers["x-auth-token"] || req.query.token;

  if (!token) return handleResponse(res, 401, "No token provided");

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);

    if (!["customer", "provider"].includes(decoded.role)) {
      return handleResponse(res, 403, "Admin password reset is not allowed");
    }

    const user = await User.findOne({ email: decoded.email, role: decoded.role });

    if (!user) {
      return handleResponse(res, 401, "Invalid or expired token");
    }

    if (user.password_reset_jti !== decoded.jti) {
      return handleResponse(res, 401, "Invalid or expired token");
    }


    if (!user.password_reset_token_expiry || user.password_reset_token_expiry < new Date()) {
      return handleResponse(res, 401, "Reset token expired");
    }

    req.user = user;

    next();
  } catch (err) {
    console.error(err);
    return handleResponse(res, 401, "Invalid or expired token");
  }
};


export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admins only." });
  }
  next();
};

export const verifyRole = (req, res) => {
  const { role } = req.user;

  let message;
  switch (role) {
    case "admin":
      message = "Admin login successful";
      break;
    case "provider":
      message = "Provider login successful";
      break;
    case "customer":
      message = "Customer login successful";
      break;
    default:
      return handleResponse(res, 400, "Invalid role");
  }

  return handleResponse(res, 200, message, {
    token: req.user.token,
    role,
    user: req.user,
  });
};


export const generateOTP = (digits = 6) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

export const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

export const compareOTPHash = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};