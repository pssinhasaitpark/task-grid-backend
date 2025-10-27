import { handleResponse } from "../../utils/helper.js";
import User from "../../models/user/user.js";



export const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" });
    
    return  handleResponse(res, 200, "Customer details fetched successfully",customers)
      
  } catch (err) {
    return handleResponse(res, 500, "Server error");
  }
};
