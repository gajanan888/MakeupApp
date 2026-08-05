import express from "express";
import {
  forgotPasswordController,
  verifyResetOtpController,
  resetPasswordController,
} from "./passwordReset.controller.js";

const router = express.Router();

router.post("/forgot-password", forgotPasswordController);
router.post("/verify-otp", verifyResetOtpController);
router.post("/reset-password", resetPasswordController);

export default router;
