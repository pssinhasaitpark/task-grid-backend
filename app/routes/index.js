import authRoutes from "./user/auth.js";
import providerApprovalRoutes from "../routes/admin/providerApproval.js"
import addressRoutes from "../routes/user/address.js"
import userRoutes from "../routes/user/userProfile.js";
import providerServicesRoutes from "../routes/user/services.js"
import adminServicesRoutes from "../routes/admin/services.js"
import availabilityRoutes from "../routes/user/availability.js"

export default (app) => {
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/address", addressRoutes);
    app.use("/api/v1/user", userRoutes);
    app.use("/api/v1/services", providerServicesRoutes);
    app.use("/api/v1/availability", availabilityRoutes);
    
    //admin routes
    app.use("/api/v1/admin", providerApprovalRoutes);
    app.use("/api/v1/admin/services", adminServicesRoutes);


};
