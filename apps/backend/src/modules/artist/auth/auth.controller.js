import {
  registerArtist,
  verifyArtistEmail,
  resendArtistVerification,
  loginArtist,
  sendEmailOtp,
} from "./auth.service.js";
import { validateRegister, validateLogin } from "./auth.validation.js";
import { logActivity } from "../../../utils/activityLogger.js";

export const sendEmailOtpController = async (req, res) => {
  try {
    const { email, name } = req.body;
    const result = await sendEmailOtp({ email, name });
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send email OTP",
    });
  }
};

export const registerArtistController = async (req, res) => {
  try {
    const { errors } = validateRegister(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
        data: null,
      });
    }

    const data = await registerArtist(req.body);

    if (data?.artist) {
      await logActivity({
        userId: data.artist.id,
        userType: "artist",
        userName: data.artist.name,
        action: "ARTIST_REGISTER",
        details: "Registered a verified artist account successfully.",
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: "Artist registered successfully.",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Artist registration failed",
      data: null,
    });
  }
};

export const loginArtistController = async (req, res) => {
  try {
    const { errors } = validateLogin(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
        data: null,
      });
    }

    const data = await loginArtist(req.body);

    if (data?.artist) {
      await logActivity({
        userId: data.artist.id,
        userType: "artist",
        userName: data.artist.name,
        action: "ARTIST_LOGIN",
        details: "Logged into the application.",
        req,
      });
    }

    res.json({
      success: true,
      message: "Artist login successful",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Artist login failed",
      data: null,
    });
  }
};

export const verifyArtistEmailController = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required",
      });
    }

    const data = await verifyArtistEmail({ email, code });

    if (data?.artist) {
      await logActivity({
        userId: data.artist.id,
        userType: "artist",
        userName: data.artist.name,
        action: "ARTIST_VERIFY_EMAIL",
        details: "Successfully verified email address.",
        req,
      });
    }

    res.json({
      success: true,
      message: data.message,
      data: data.artist,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Email verification failed",
    });
  }
};

export const resendArtistVerificationController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const data = await resendArtistVerification({ email });

    res.json({
      success: true,
      message: data.message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to resend verification email",
    });
  }
};
