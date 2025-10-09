import User from "../../models/user.js";
import { handleResponse } from "../../utils/helper.js";
import { signAccessToken } from "../../middlewares/jwtAuth.js";


export const registerUser = async (req, res) => {

    const { name, email, password, phone, address, serviceArea, role } = req.body;
  
    try {
 
      if (!['customer', 'provider'].includes(role)) {
        return handleResponse(res, 400, "Invalid role. Must be 'customer' or 'provider'");
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
        address,
        role,
        serviceArea: role === 'provider' ? serviceArea : null,
        isVerified: role === 'customer' ? true : false,
      });
  
      await user.save();
  

      const message =
        role === 'provider'
          ? "Registered successfully as provider. Please wait for admin approval."
          : "Registered successfully as customer.";
  
      const { password: _, ...userData } = user.toObject();
  
      handleResponse(res, 201, message, userData);
  
    } catch (err) {
      console.error("Registration Error:", err);
      handleResponse(res, 500, "Server error");
    }
};
  
export const loginUser = async (req, res) => {
    const { email, password, role } = req.body;
  
    if (!['customer', 'provider', 'admin'].includes(role)) {
      return handleResponse(res, 400, 'Invalid role');
    }
  
    try {
      const user = await User.findOne({ email, role });
      if (!user) {
        return handleResponse(res, 401, 'Invalid email or role');
      }
  
   
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return handleResponse(res, 400, 'Invalid email or password');
  
      if (role === 'provider' && !user.isVerified) {
        return handleResponse(res, 403, 'Provider not verified yet');
      }
  
      const token = await signAccessToken(user._id.toString(), user.role);
  
      return handleResponse(res, 200, 'Login successful', {
        token,
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          serviceArea: user.serviceArea,
        }
      });
    } catch (err) {
      console.error(err);
      return handleResponse(res, 500, 'Server error');
    }

};
