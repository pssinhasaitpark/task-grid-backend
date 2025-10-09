import express from "express";
import {
  approveProvider,
  getUnapprovedProviders,
} from "../../controllers/admin/providerApproval.js";
import { isAdmin, verifyToken } from "../../middlewares/jwtAuth.js";

const router = express();

router.patch("/approve-provider/:id", verifyToken, isAdmin, approveProvider);

router.get(
  "/unapproved-providers",
  verifyToken,
  isAdmin,
  getUnapprovedProviders
);

export default router;
