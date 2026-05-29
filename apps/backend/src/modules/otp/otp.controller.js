import { sendOtp, verifyOtp } from "./otp.service.js";

export const sendOtpController = async (req, res) => {
  try {
    const { phone } = req.body;

    const data = await sendOtp(phone);
    res.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const details =
      error?.response?.data?.Details ||
      error?.response?.data?.details ||
      error?.response?.data?.Message;

    res.status(status).json({
      success: false,
      message: details || error.message || "OTP sending failed",
    });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    const data = await verifyOtp(sessionId, otp);
    res.json(data);
  } catch (error) {
    const status = error?.response?.status || 500;
    const details =
      error?.response?.data?.Details ||
      error?.response?.data?.details ||
      error?.response?.data?.Message;

    res.status(status).json({
      success: false,
      message: details || error.message || "OTP verification failed",
    });
  }
};
