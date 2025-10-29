import Wishlist from "../../models/user/wishlist.js";
import User from "../../models/user/user.js";
import { handleResponse } from "../../utils/helper.js";
import ProviderService from "../../models/services/providerService.js";




export const toggleProviderWishlist = async (req, res) => {
    const customerId = req.user._id;
    const userRole = req.user.role;
    const { providerId } = req.body;
  
    try {
    
      if (userRole !== "customer") {
        return handleResponse(res, 403, "Only customers can add wishlist");
      }
  
      const provider = await User.findById(providerId);
      if (!provider || provider.role !== "provider") {
        return handleResponse(res, 404, "Provider not found");
      }
  
    
      let wishlist = await Wishlist.findOne({ customer: customerId });
      if (!wishlist) {
        wishlist = new Wishlist({ customer: customerId, providers: [] });
      }
  
      let action = "";
  
      if (wishlist.providers.includes(providerId)) {
        wishlist.providers = wishlist.providers.filter(
          (id) => id.toString() !== providerId
        );
        action = "removed";
      } else {
        wishlist.providers.push(providerId);
        action = "added";
      }
  
      await wishlist.save();
      await wishlist.populate("providers", "_id name");
  
      const providers = wishlist.providers.map((p) => ({
        _id: p._id,
        name: p.name,
      }));
  
      handleResponse(
        res,
        200,
        `Provider successfully ${action} to wishlist`,
        wishlist.providers.length > 0
          ? { wishlistId: wishlist._id, providers }
          : { providers: [] }
      );
    } catch (err) {
      handleResponse(res, 500, err.message);
    }
};
  
  
export const getWishlist = async (req, res) => {
    const customerId = req.user._id;
  
    try {
      const wishlist = await Wishlist.findOne({ customer: customerId })
        .populate("providers", "_id name role isVerified");
  
      if (!wishlist || wishlist.providers.length === 0) {
        return handleResponse(res, 200, "Wishlist is empty", {
          providers: [],
        });
      }
  
     
      const providerIds = wishlist.providers.map((p) => p._id);
  
     
      const providerServices = await ProviderService.find({
        provider: { $in: providerIds },
      })
        .populate("template", "name category") 
        .lean();
  
      
      const servicesByProvider = {};
      providerServices.forEach((service) => {
        const pid = service.provider.toString();
        if (!servicesByProvider[pid]) servicesByProvider[pid] = [];
        servicesByProvider[pid].push(service);
      });
  
      const providers = wishlist.providers.map((p) => ({
        _id: p._id,
        name: p.name,
        role: p.role,
        isVerified: p.isVerified,
        services: servicesByProvider[p._id.toString()] || [],
      }));
  
      handleResponse(res, 200, "Wishlist retrieved", {
        wishlistId: wishlist._id,
        providers,
      });
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      handleResponse(res, 500, err.message);
    }
};


export const clearWishlist = async (req, res) => {
  const customerId = req.user._id;

  try {
      const wishlist = await Wishlist.findOne({ customer: customerId });
      
    if (!wishlist) return handleResponse(res, 404, "Wishlist not found");

    wishlist.providers = [];
    await wishlist.save();

    handleResponse(res, 200, "Wishlist cleared");
  } catch (err) {
    handleResponse(res, 500, err.message);
  }
};
