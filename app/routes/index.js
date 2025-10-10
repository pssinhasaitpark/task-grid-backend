import authRoutes from "./user/auth.js";
import providerApprovalRoutes from "../routes/admin/providerApproval.js"
import addressRoutes from "../routes/user/address.js"
import userRoutes from "../routes/user/userProfile.js";

import adminServicesRoutes from "../routes/admin/services.js"

export default (app) => {
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/address",addressRoutes)
    app.use("/api/v1/user",userRoutes)
    //admin routes
    app.use("/api/v1/admin", providerApprovalRoutes);
    app.use("/api/v1/admin/services", adminServicesRoutes);


};
