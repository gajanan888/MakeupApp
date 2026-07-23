import express from "express";
import {
  loginArtistController,
  registerArtistController,
  verifyArtistEmailController,
  resendArtistVerificationController,
  sendEmailOtpController,
} from "./auth.controller.js";

const router = express.Router();

router.post("/register", registerArtistController);
router.post("/login", loginArtistController);
router.post("/verify-email", verifyArtistEmailController);
router.post("/resend-verification", resendArtistVerificationController);
router.post("/send-email-otp", sendEmailOtpController);

export default router;
