import Booking from "../../models/booking/booking.js";
import { handleResponse } from "../../utils/helper.js";
import razorpayInstance from "../../config/razorpay.js";
import { calculateBookingAmount } from "../../utils/calculateBookingAmount.js";
import ProviderService from "../../models/services/providerService.js";
import User from "../../models/user/user.js";
import crypto from "crypto";
import mongoose from "mongoose";





export const createBooking = async (req, res) => {
  try {
    const { providerId, serviceId, bookingDate, addressId } = req.body || {};

    if (!providerId || !serviceId || !bookingDate || !addressId) {
      return handleResponse(res, 400, "All fields are required");
    }

    const customerId = req.user.id;

    const { calculations } = await calculateBookingAmount(
      providerId,
      serviceId
    );
    const amount = calculations.paidOnline;

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${new Date().getTime()}`,
    };
    const razorpayOrder = await razorpayInstance.orders.create(options);
    if (!razorpayOrder) {
      return handleResponse(res, 500, "Error creating Razorpay order");
    }

    const booking = new Booking({
      customer: customerId,
      provider: providerId,
      service: serviceId,
      bookingDate: new Date(bookingDate),
      location: addressId,
      amount,
      paymentStatus: "pending",
      otp: null,
      razorpayOrderId: razorpayOrder.id,
    });
    await booking.save();

    const provider = await User.findById(providerId).select("name");
    const service = await ProviderService.findById(serviceId).select(
      "name duration"
    );

    return handleResponse(res, 201, "Booking created successfully", {
      bookingId: booking._id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      provider: provider?.name,
      service: service?.name,
      serviceDuration: service?.duration,
      bookingDate: booking.bookingDate,
      otp: booking.otp,
    });
  } catch (error) {
    console.error(error);
    return handleResponse(res, 500, "Internal server error", {
      error: error.message,
    });
  }
};


export const razorpayWebhook = async (req, res) => {
  try {
    const razorpaySignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      console.log("⚠️ Invalid webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      console.log("✅ Payment captured:", payment.id);

      const otp = Math.floor(100000 + Math.random() * 900000);

      const booking = await Booking.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: "paid", otp: otp },
        { new: true }
      );

      if (booking) {
        console.log("Booking marked as paid ", booking._id);
      } else {
        console.log("Booking not found for order:", payment.order_id);
      }
    }

    if (event === "payment.failed") {
      const payment = req.body.payload.payment.entity;

      await Booking.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        { paymentStatus: "failed" }
      );

      console.log("❌ Payment failed:", payment.id);
    }

    res.status(200).json({ message: "Webhook received" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getInvoiceDetails = async (req, res) => {
  try {
    const { providerId, providerServiceId } = req.query;

    if (!providerId || !providerServiceId) {
      return handleResponse(
        res,
        400,
        "providerId and providerServiceId are required"
      );
    }

    const fullInvoice = await calculateBookingAmount(
      providerId,
      providerServiceId
    );

    const invoiceDetails = {
      provider: {
        id: fullInvoice.provider._id,
        name: fullInvoice.provider.name,
      },
      providerService: {
        id: fullInvoice.providerService._id,
        description: fullInvoice.providerService.description || "",
        dailyRate: fullInvoice.providerService.dailyRate || 0,
        hourlyRate: fullInvoice.providerService.hourlyRate || 0,
      },
      template: {
        id: fullInvoice.template._id,
        name: fullInvoice.template.name,
      },
      calculations: {
        discount: fullInvoice.calculations.discount || 0,
        additionalCost: fullInvoice.calculations.additionalCost || 0,
        igstTaxAmount: fullInvoice.calculations.igstTaxAmount || 0,
        sgstTaxAmount: fullInvoice.calculations.sgstTaxAmount || 0,
        convenienceFee: fullInvoice.calculations.convenienceFee || 0,
        tokenAmount: fullInvoice.calculations.tokenAmount || 0,
        paidOnline: fullInvoice.calculations.paidOnline || 0,
        payToProvider: fullInvoice.calculations.payToProvider || 0,
      },
    };

    return handleResponse(
      res,
      200,
      "Invoice details fetched successfully",
      invoiceDetails
    );
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return handleResponse(res, 500, "Internal server error", {
      error: error.message,
    });
  }
};


export const getMyBookings = async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
  
      let filter = { paymentStatus: "paid" }; 
      if (userRole === "customer") {
        filter.customer = userId;
      } else if (userRole === "provider") {
        filter.provider = userId;
      } else {
        return handleResponse(
          res,
          403,
          "Access denied: Only customers or providers can view bookings"
        );
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const totalBookings = await Booking.countDocuments(filter);
  
      const bookings = await Booking.find(filter)
        .populate({
          path: "provider",
          select: "name profile_image",
          model: "User",
        })
        .populate({
          path: "customer",
          select: "name email phone profile_image",
          model: "User",
        })
        .populate({
          path: "service",
          select: "hourlyRate dailyRate description isApproved template",
          model: "ProviderService",
          populate: {
            path: "template",
            select: "name image",
            model: "ServiceTemplate",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      if (!bookings || bookings.length === 0) {
        return handleResponse(res, 200, "No bookings found");
      }
  
      const formattedBookings = bookings.map((b) => ({
        bookingId: b._id,
        provider: {
          name: b.provider?.name,
          image: b.provider?.profile_image,
        },
        customer: {
          name: b.customer?.name,
          email: b.customer?.email,
          phone: b.customer?.phone,
          image: b.customer?.profile_image,
        },
        service: {
          name: b.service?.template?.name,
          image: b.service?.template?.image,
          hourlyRate: b.service?.hourlyRate,
          dailyRate: b.service?.dailyRate,
          description: b.service?.description,
          isApproved: b.service?.isApproved,
        },
        amount: b.amount,
        bookingDate: b.bookingDate,
        paymentStatus: b.paymentStatus,
        bookingStatus: b.bookingStatus,
        createdAt: b.createdAt,
      }));
  
      return handleResponse(res, 200, "Bookings fetched successfully", {
        bookings: formattedBookings,
        pagination: {
          total: totalBookings,
          page,
          limit,
          totalPages: Math.ceil(totalBookings / limit),
        },
      });
    } catch (error) {
      console.error(error);
      return handleResponse(res, 500, "Internal server error", {
        error: error.message,
      });
    }
};
  

export const getBookingById = async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
  
      if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        return handleResponse(res, 400, "Invalid booking ID");
      }
  
      const booking = await Booking.findById(bookingId)
        .populate({
          path: "provider",
          select: "name email phone profile_image",
          model: "User",
        })
        .populate({
          path: "customer",
          select: "name email phone profile_image",
          model: "User",
        })
        .populate({
          path: "service",
          select: "hourlyRate dailyRate description isApproved template",
          model: "ProviderService",
          populate: {
            path: "template",
            select: "name image",
            model: "ServiceTemplate",
          },
        })
        .populate({
          path: "location",
          select: "addressLine city state zipcode",
          model: "Address",
        });
  
      if (!booking) {
        return handleResponse(res, 404, "Booking not found");
      }
  
      if (
        (userRole === "customer" && booking.customer._id.toString() !== userId) ||
        (userRole === "provider" && booking.provider._id.toString() !== userId)
      ) {
        return handleResponse(res, 403, "Access denied");
      }
  
     
      const invoiceDetails = await calculateBookingAmount(
        booking.provider._id,
        booking.service._id
      );
  
      const formattedBooking = {
        bookingId: booking._id,
        provider: {
          name: booking.provider?.name,
          email: booking.provider?.email,
          phone: booking.provider?.phone,
          image: booking.provider?.profile_image,
        },
        customer: {
          name: booking.customer?.name,
          email: booking.customer?.email,
          phone: booking.customer?.phone,
          image: booking.customer?.profile_image,
        },
        service: {
          name: booking.service?.template?.name,
          image: booking.service?.template?.image,
          hourlyRate: booking.service?.hourlyRate,
          dailyRate: booking.service?.dailyRate,
          description: booking.service?.description,
          isApproved: booking.service?.isApproved,
        },
        location: booking.location,
        amount: booking.amount,
        bookingDate: booking.bookingDate,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        otp: booking.otp,
        invoice: {
          discount: invoiceDetails.calculations.discount || 0,
          additionalCost: invoiceDetails.calculations.additionalCost || 0,
          igstTaxAmount: invoiceDetails.calculations.igstTaxAmount || 0,
          sgstTaxAmount: invoiceDetails.calculations.sgstTaxAmount || 0,
          convenienceFee: invoiceDetails.calculations.convenienceFee || 0,
          tokenAmount: invoiceDetails.calculations.tokenAmount || 0,
          paidOnline: invoiceDetails.calculations.paidOnline || 0,
          payToProvider: invoiceDetails.calculations.payToProvider || 0,
        },
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
  
      return handleResponse(
        res,
        200,
        "Booking fetched successfully",
        formattedBooking
      );
    } catch (error) {
      console.error(error);
      return handleResponse(res, 500, "Internal server error", {
        error: error.message,
      });
    }
};
  

export const updateBookingStatus = async (req, res) => {
    try {
      const bookingId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { bookingStatus } = req.body;
  
        
      if (userRole !== "provider") {
        return handleResponse(res, 403, "Access denied: Only providers can update status");
      }
  
      
      if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
        return handleResponse(res, 400, "Invalid booking ID");
      }
  
      
      const validStatuses = ["pending", "confirmed", "started", "completed", "cancelled"];
      if (!bookingStatus || !validStatuses.includes(bookingStatus)) {
        return handleResponse(
          res,
          400,
          `Invalid booking status. Valid values: ${validStatuses.join(", ")}`
        );
      }
  
    
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return handleResponse(res, 404, "Booking not found");
      }
  
    
      if (booking.provider.toString() !== userId) {
        return handleResponse(res, 403, "Access denied: Not your booking");
      }
  
      const currentStatus = booking.bookingStatus;
      const workflow = ["pending", "confirmed", "started", "completed"];
  
     
      if (bookingStatus === "cancelled") {
        if (!["pending", "confirmed"].includes(currentStatus)) {
          return handleResponse(
            res,
            400,
            `Cannot cancel booking after it has started or completed. Current status: "${currentStatus}"`
          );
        }
      } else {

        const currentIndex = workflow.indexOf(currentStatus);
        const nextIndex = workflow.indexOf(bookingStatus);
  
        if (nextIndex !== currentIndex + 1) {
          return handleResponse(
            res,
            400,
            `Invalid status transition from "${currentStatus}" to "${bookingStatus}". Must follow: pending → confirmed → started → completed`
          );
        }
      }
  
  
      if (bookingStatus === "started" && !booking.isOtpVerified) {
        return handleResponse(
          res,
          400,
          "OTP verification required before starting the service"
        );
      }
  

      booking.bookingStatus = bookingStatus;
      booking.updatedAt = Date.now();
      await booking.save();
  
      return handleResponse(res, 200, "Booking status updated successfully", {
        bookingId: booking._id,
        bookingStatus: booking.bookingStatus,
        updatedAt: booking.updatedAt,
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      return handleResponse(res, 500, "Internal server error", { error: error.message });
    }
};
  
  
export const verifyBookingOtp = async (req, res) => {
    try {
      const { otp } = req.body;
      const bookingId = req.params.id;
      const userId = req.user.id;
  
      const booking = await Booking.findById(bookingId);
      if (!booking) return handleResponse(res, 404, "Booking not found");
  
      if (booking.provider.toString() !== userId) {
        return handleResponse(res, 403, "Access denied: Not your booking");
      }
  
      if (booking.otp !== otp) {
        return handleResponse(res, 400, "Invalid OTP");
      }
  
      booking.isOtpVerified = true;
      await booking.save();
  
      return handleResponse(res, 200, "OTP verified successfully");
    } catch (err) {
      console.error(err);
      return handleResponse(res, 500, "Internal server error", { error: err.message });
    }
};
  