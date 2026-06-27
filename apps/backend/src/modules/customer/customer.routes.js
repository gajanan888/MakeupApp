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
router.get("/artists", protectCustomer, getArtistsController);
router.get("/trending-artists", protectCustomer, getTrendingArtistsController);

export default router;
