import Booking from "../../models/booking/booking.js";
import { handleResponse } from "../../utils/helper.js";



export const getAllBookings = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        paymentStatus,
        bookingStatus,
        search,
      } = req.query;
  

      const validPaymentStatuses = ["pending", "paid", "failed"];
      const validBookingStatuses = [
        "pending",
        "confirmed",
        "cancelled",
        "started",
        "completed",
      ];
  
     
      if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        return handleResponse(
          res,
          400,
          `Invalid paymentStatus value. Allowed values: ${validPaymentStatuses.join(", ")}`
        );
      }
  
   
      if (bookingStatus && !validBookingStatuses.includes(bookingStatus)) {
        return handleResponse(
          res,
          400,
          `Invalid bookingStatus value. Allowed values: ${validBookingStatuses.join(", ")}`
        );
      }
  
     
      const filters = {};
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (bookingStatus) filters.bookingStatus = bookingStatus;
  
      
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
  

      if (search) {
        const userIds = await User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id");
  
        const matchedIds = userIds.map((u) => u._id);
        filters.$or = [
          { customer: { $in: matchedIds } },
          { provider: { $in: matchedIds } },
        ];
      }
  
     
      const bookings = await Booking.find(filters)
        .populate("customer", "name email phone")
        .populate("provider", "name email phone")
        .populate("service", "serviceName price description")
        .populate("location", "address city state pincode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
  
      const totalBookings = await Booking.countDocuments(filters);
  
      if (!bookings || bookings.length === 0) {
        return handleResponse(res, 200, "No bookings found");
      }
  
      return handleResponse(res, 200, "Bookings fetched successfully", {
        total: totalBookings,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalBookings / limitNum),
        data: bookings,
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return handleResponse(res, 500, "Internal server error");
    }
  };
  