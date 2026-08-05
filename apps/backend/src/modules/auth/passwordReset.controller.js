import {
  sendForgotPasswordOtp,
  verifyResetOtp,
  resetPassword,
} from "./passwordReset.service.js";

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, userRole } = req.body;
    const result = await sendForgotPasswordOtp({ email, userRole });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyResetOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyResetOtp({ email, otp });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const { email, otp, newPassword, userRole } = req.body;
    const result = await resetPassword({ email, otp, newPassword, userRole });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
