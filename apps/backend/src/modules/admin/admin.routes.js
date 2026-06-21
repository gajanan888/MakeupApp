import express from "express";
import {
  changeAdminPasswordController,
  getAdminProfileController,
  getDashboardAnalyticsController,
  listArtistsController,
  listBookingsController,
  listCustomersController,
  updateBookingStatusController,
  verifyArtistController,
  getTechHealthController,
} from "./admin.controller.js";
import { protectAdmin } from "../../middleware/adminAuth.js";

const router = express.Router();

router.get("/me", protectAdmin, getAdminProfileController);
router.put("/password", protectAdmin, changeAdminPasswordController);

router.get("/dashboard", protectAdmin, getDashboardAnalyticsController);
router.get("/tech-health", protectAdmin, getTechHealthController);

router.get("/customers", protectAdmin, listCustomersController);
router.get("/artists", protectAdmin, listArtistsController);
router.patch("/artists/:id/verify", protectAdmin, verifyArtistController);

router.get("/bookings", protectAdmin, listBookingsController);
router.patch(
  "/bookings/:id/status",
  protectAdmin,
  updateBookingStatusController,
);

export default router;
