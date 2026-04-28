import express from "express";
import {
  getArtistsController,
  getProfile,
  updateProfile,
} from "./customer.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protectCustomer, getProfile);
router.put("/profile", protectCustomer, updateProfile);
router.get("/artists", protectCustomer, getArtistsController);

export default router;
