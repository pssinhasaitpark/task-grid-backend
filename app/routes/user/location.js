import express from "express";
import { searchLocations } from "../../controllers/user/location.js";

const router = express.Router();

router.get("/", searchLocations);

export default router;