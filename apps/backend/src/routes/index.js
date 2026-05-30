import express from "express";

import customerRoutes from "../modules/customer/customer.routes.js";
import customerAuthRoutes from "../modules/customer/customerAuth.routes.js";
import artistRoutes from "../modules/artist/artist.routes.js";
import artistAuthRoutes from "../modules/artist/artistAuth.routes.js";
import bookingRoutes from "../modules/booking/booking.routes.js";
import adminAuthRoutes from "../modules/admin/auth.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import otpRoutes from "../modules/otp/otp.routes.js";
import uploadRoutes from "../modules/upload/upload.routes.js";

const router = express.Router();

router.use("/customer/auth", customerAuthRoutes);
router.use("/customer", customerRoutes);
router.use("/artist/auth", artistAuthRoutes);
router.use("/artist", artistRoutes);
router.use("/booking", bookingRoutes);
router.use("/admin/auth", adminAuthRoutes);
router.use("/admin", adminRoutes);
router.use("/otp", otpRoutes);
router.use("/upload", uploadRoutes);

export default router;
