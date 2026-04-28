import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import customerRoutes from "../modules/customer/customer.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/customer", customerRoutes);

export default router;
