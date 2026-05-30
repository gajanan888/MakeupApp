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

  // normalize phone: remove leading +, add country code 91 for 10-digit numbers
  let normalized = String(phone).trim();
  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1);
  }

  // if local 10-digit number provided, assume India (91)
  const digitsOnly = normalized.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    normalized = `91${digitsOnly}`;
  } else {
    normalized = digitsOnly;
  }

  const templateName = OTP_TEMPLATE ? OTP_TEMPLATE.trim() : "";
  const template = templateName ? encodeURIComponent(templateName) : null;
  const url = template
    ? `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/${normalized}/${template}`
    : `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/${normalized}/AUTOGEN`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    // surface provider error details for easier debugging
    const details = err?.response?.data || err?.message || String(err);
    const e = new Error('OTP provider error');
    e.response = { data: details, status: err?.response?.status };
    throw e;
  }
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
