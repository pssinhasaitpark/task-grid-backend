import Booking from "../../models/booking/booking.js";
import {handleResponse} from "../../utils/helper.js";
import razorpayInstance from "../../config/razorpay.js";
import { calculateBookingAmount } from "../../utils/calculateBookingAmount.js";
import ProviderService from "../../models/services/providerService.js";
import User from "../../models/user/user.js";
import crypto from "crypto";




export const createBooking = async (req, res) => {
    try {
        const { providerId, serviceId, bookingDate, addressId } = req.body;

        if (!providerId || !serviceId || !bookingDate || !addressId) {
            return handleResponse(res, 400, "All fields are required");
        }

        const customerId = req.user.id;
        const otp = Math.floor(100000 + Math.random() * 900000); 


        const { calculations } = await calculateBookingAmount(providerId, serviceId);
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
            otp: otp||"123456",
        });
        await booking.save();

     
        const provider = await User.findById(providerId).select("name");
        const service = await ProviderService.findById(serviceId).select("name duration");

     
        return handleResponse(res, 201, "Booking created successfully", {
            bookingId: booking._id,
            razorpayOrderId: razorpayOrder.id, 
            amount,
            provider: provider?.name,
            service: service?.name,
            serviceDuration: service?.duration,
            bookingDate: booking.bookingDate,
            otp:booking.otp
        });

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Internal server error", { error: error.message });
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

            console.log("✅ Payment captured: ", payment.id);

        
            const booking = await Booking.findOneAndUpdate(
                { razorpayOrderId: payment.order_id }, 
                { paymentStatus: "paid" },
                { new: true }
            );

            if (booking) {
                console.log("Booking marked as paid:", booking._id);
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
        return handleResponse(res, 400, "providerId and providerServiceId are required");
      }
  
      const fullInvoice = await calculateBookingAmount(providerId, providerServiceId);

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
  
      return handleResponse(res, 200, "Invoice details fetched successfully", invoiceDetails);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      return handleResponse(res, 500, "Internal server error", { error: error.message });
    }
};


export const getMyBookings = async (req, res) => {
    try {
        const customerId = req.user.id; 

   
        const bookings = await Booking.find({ customer: customerId })
            .populate({
                path: "provider",
                select: "name email phone", 
                model: User
            })
            .populate({
                path: "service",
                select: "name duration price",
                model: ProviderService
            })
            .sort({ createdAt: -1 }); 

        if (!bookings || bookings.length === 0) {
            return handleResponse(res, 404, "No bookings found");
        }

        const formattedBookings = bookings.map((b) => ({
            bookingId: b._id,
            provider: b.provider?.name,
            service: b.service?.name,
            serviceDuration: b.service?.duration,
            amount: b.amount,
            bookingDate: b.bookingDate,
            paymentStatus: b.paymentStatus,
            createdAt: b.createdAt,
        }));

        return handleResponse(res, 200, "Bookings fetched successfully", formattedBookings);

    } catch (error) {
        console.error(error);
        return handleResponse(res, 500, "Internal server error", { error: error.message });
    }
};

