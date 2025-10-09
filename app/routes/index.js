import authRoutes from "../routes/auth/auth.js";
import providerApprovalRoutes from "../routes/admin/providerApproval.js"

import adminServicesRoutes from "../routes/admin/services.js"

export default (app) => {
    app.use("/api/v1/auth", authRoutes);
    
    app.use("/api/v1/admin", providerApprovalRoutes);
    app.use("/api/v1/admin/services",adminServicesRoutes)

};
