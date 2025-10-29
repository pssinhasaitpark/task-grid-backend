import authRoutes from "./user/auth.js";
import providerApprovalRoutes from "../routes/admin/providerApproval.js";
import addressRoutes from "../routes/user/address.js";
import userRoutes from "../routes/user/userProfile.js";
import providerServicesRoutes from "../routes/user/services.js";
import adminServicesRoutes from "../routes/admin/services.js";
import availabilityRoutes from "../routes/user/availability.js";
import locationRoutes from "../routes/user/location.js";
import customerRoutes from "../routes/admin/customer.js";
import wishListRoutes from "../routes/user/wishlist.js";
import bookingRoutes from "../routes/booking/booking.js"
export default (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/address", addressRoutes);
  app.use("/api/v1/user", userRoutes);
  app.use("/api/v1/services", providerServicesRoutes);
  app.use("/api/v1/availability", availabilityRoutes);
  app.use("/api/v1/location", locationRoutes);
  app.use("/api/v1/booking", bookingRoutes);
  app.use("/api/v1/wishlist",wishListRoutes)

  app.use("/api/v1/admin", providerApprovalRoutes);
  app.use("/api/v1/admin/services", adminServicesRoutes);
  app.use("/api/v1/admin", customerRoutes);
};
