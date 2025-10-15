import express from "express";
import {
  approveProvider,
  getUnapprovedProviders,
} from "../../controllers/admin/providerApproval.js";
import { isAdmin, verifyToken } from "../../middlewares/jwtAuth.js";

const router = express();

router.post("/approve-provider/:id", approveProvider);

router.get(
  "/unapproved-providers",
  getUnapprovedProviders
);

export default router;
