import express from "express";
import {
  getArtistsController,
  getTrendingArtistsController,
  getProfile,
  updateProfile,
} from "./customer.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protectCustomer, getProfile);
router.put("/profile", protectCustomer, updateProfile);
router.get("/artists", getArtistsController);
router.get("/trending-artists", getTrendingArtistsController);

export default router;
