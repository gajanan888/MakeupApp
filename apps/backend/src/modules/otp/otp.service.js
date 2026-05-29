import axios from "axios";

const OTP_API_KEY = process.env.OTP_API_KEY;
const OTP_TEMPLATE = process.env.OTP_TEMPLATE;

export const sendOtp = async (phone) => {
  if (!phone) {
    throw new Error("Phone is required");
  }

  if (!OTP_API_KEY) {
    throw new Error("OTP API key is not configured");
  }

  const templateName = OTP_TEMPLATE ? OTP_TEMPLATE.trim() : "";
  const template = templateName ? encodeURIComponent(templateName) : null;
  const url = template
    ? `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/${phone}/${template}`
    : `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/${phone}/AUTOGEN`;

  const response = await axios.get(url);

  return response.data;
};

export const verifyOtp = async (sessionId, otp) => {
  if (!sessionId || !otp) {
    throw new Error("Session ID and OTP are required");
  }

  if (!OTP_API_KEY) {
    throw new Error("OTP API key is not configured");
  }

  const response = await axios.get(
    `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
  );

  return response.data;
};
