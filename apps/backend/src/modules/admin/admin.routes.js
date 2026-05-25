import express from "express";
import {
  changeAdminPasswordController,
  getAdminProfileController,
  getDashboardAnalyticsController,
  listArtistsController,
  listBookingsController,
  listCustomersController,
  updateBookingStatusController,
} from "./admin.controller.js";
import { protectAdmin } from "../../middleware/adminAuth.js";

const router = express.Router();

router.get("/me", protectAdmin, getAdminProfileController);
router.put("/password", protectAdmin, changeAdminPasswordController);

router.get("/dashboard", protectAdmin, getDashboardAnalyticsController);

router.get("/customers", protectAdmin, listCustomersController);
router.get("/artists", protectAdmin, listArtistsController);

router.get("/bookings", protectAdmin, listBookingsController);
router.patch(
  "/bookings/:id/status",
  protectAdmin,
  updateBookingStatusController,
);

export default router;
