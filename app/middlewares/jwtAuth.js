import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { handleResponse } from '../utils/helper.js';



export const signAccessToken = (id, role) => {
  return generateToken(id, role, process.env.ACCESS_TOKEN_SECRET);
};


export const generateToken = (id, role, secret, expiresIn = process.env.EXPIREIN || '1d') => {
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
    req.headers.authorization ||
    req.headers['x-auth-token'] ||
    req.query.token;

  if (!token) {
    return handleResponse(res, 401, 'No token provided');
  }

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return handleResponse(res, 401, 'Invalid or expired token');
    }

    req.user = user; 
    next();
  } catch (err) {
    return handleResponse(res, 401, 'Invalid or expired token');
  }
};


export const verifyResetToken = async (req, res, next) => {
  let token =
    req.headers.authorization ||
    req.headers['x-auth-token'] ||
    req.query.token;

  if (!token) return handleResponse(res, 401, 'No token provided');

  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);

    const user = await User.findOne({ email: decoded.email });

    if (!user || user.password_reset_jti !== decoded.jti) {
      return handleResponse(res, 401, 'Invalid or expired token');
    }

    req.user = user; 
    next();
  } catch (err) {
    return handleResponse(res, 401, 'Invalid or expired token');
  }
};


export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }
  next();
};


export const verifyRole = (req, res) => {
  const { role } = req.user;

  let message;
  switch (role) {
    case 'admin':
      message = 'Admin login successful';
      break;
    case 'provider':
      message = 'Provider login successful';
      break;
    case 'customer':
      message = 'Customer login successful';
      break;
    default:
      return handleResponse(res, 400, 'Invalid role');
  }

  return handleResponse(res, 200, message, {
    token: req.user.token,
    role,
    user: req.user
  });
};
