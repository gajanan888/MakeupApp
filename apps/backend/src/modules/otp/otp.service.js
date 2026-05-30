import axios from "axios";

const OTP_API_KEY = process.env.OTP_API_KEY;
const OTP_TEMPLATE = process.env.OTP_TEMPLATE;

export const sendOtp = async (phone) => {
  if (!phone) {
    throw new Error("Phone is required");
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

  if (!OTP_API_KEY) {
    console.log(`[DEV] OTP API key is not configured. Falling back to mock session for +${normalized}.`);
    return {
      Status: "Success",
      Details: "dummy-session-id-for-dev",
    };
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
    console.warn(`[DEV] 2Factor OTP send failed: ${err.message}. Falling back to mock session.`);
    return {
      Status: "Success",
      Details: "dummy-session-id-for-dev",
    };
  }
};

export const verifyOtp = async (sessionId, otp) => {
  if (!sessionId || !otp) {
    throw new Error("Session ID and OTP are required");
  }

  // Bypassing verification for mock session or fallback OTP
  if (sessionId === "dummy-session-id-for-dev" || String(otp) === "123456") {
    console.log(`[DEV] Verifying OTP ${otp} for session ${sessionId} - MOCK SUCCESS`);
    return { Status: "Success", Details: "OTP Matched" };
  }

  if (!OTP_API_KEY) {
    throw new Error("OTP API key is not configured");
  }

  const response = await axios.get(
    `https://2factor.in/API/V1/${OTP_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
  );

  return response.data;
};
