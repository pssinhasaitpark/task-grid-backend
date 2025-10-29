import express from "express";
import {
  toggleProviderWishlist,
  getWishlist,
  clearWishlist,
} from "../../controllers/user/wishlist.js";
import { verifyToken } from "../../middlewares/jwtAuth.js";

const router = express.Router();

router.post("/", verifyToken, toggleProviderWishlist);
router.get("/", verifyToken, getWishlist);
router.post("/clear", verifyToken, clearWishlist);

export default router;
