import bcrypt from "bcrypt";
import Customer from "../../models/Customer.js";
import Artist from "../../models/Artist.js";
import EmailOtp from "../../models/EmailOtp.js";
import { sendVerificationEmail } from "../../services/email.service.js";

/**
 * Send Password Reset OTP to email for Customer or Artist
 */
export const sendForgotPasswordOtp = async ({ email, userRole }) => {
  if (!email || !email.trim()) {
    throw new Error("Email address is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  let user = null;
  let detectedRole = userRole;

  if (userRole === "artist") {
    user = await Artist.findOne({ where: { email: normalizedEmail } });
  } else if (userRole === "client") {
    user = await Customer.findOne({ where: { email: normalizedEmail } });
  } else {
    // Try customer first, then artist
    user = await Customer.findOne({ where: { email: normalizedEmail } });
    if (user) {
      detectedRole = "client";
    } else {
      user = await Artist.findOne({ where: { email: normalizedEmail } });
      if (user) detectedRole = "artist";
    }
  }

  if (!user) {
    throw new Error("No account found with this email address");
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  let record = await EmailOtp.findOne({ where: { email: normalizedEmail } });
  if (record) {
    record.otp = verificationCode;
    record.expiresAt = verificationCodeExpires;
    await record.save();
  } else {
    await EmailOtp.create({
      email: normalizedEmail,
      otp: verificationCode,
      expiresAt: verificationCodeExpires,
    });
  }

  try {
    await sendVerificationEmail(normalizedEmail, user.name || "User", verificationCode);
  } catch (err) {
    console.error("[Email Error] Failed to send password reset email:", err);
  }

  return {
    success: true,
    message: "Password reset OTP sent to your email address.",
    userRole: detectedRole,
  };
};

/**
 * Verify OTP for password reset
 */
export const verifyResetOtp = async ({ email, otp }) => {
  if (!email || !email.trim()) {
    throw new Error("Email address is required");
  }
  if (!otp || !otp.trim()) {
    throw new Error("Verification OTP code is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const otpRecord = await EmailOtp.findOne({ where: { email: normalizedEmail } });

  if (!otpRecord || otpRecord.otp !== otp.trim()) {
    throw new Error("Invalid OTP code. Please check and try again.");
  }

  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new Error("OTP code has expired. Please request a new one.");
  }

  return {
    success: true,
    message: "OTP code verified successfully.",
  };
};

/**
 * Reset password after OTP verification
 */
export const resetPassword = async ({ email, otp, newPassword, userRole }) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  // Verify OTP again for security
  await verifyResetOtp({ email, otp });

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  let updated = false;

  if (userRole === "artist") {
    const artist = await Artist.findOne({ where: { email: normalizedEmail } });
    if (artist) {
      artist.password = hashedPassword;
      await artist.save();
      updated = true;
    }
  } else if (userRole === "client") {
    const customer = await Customer.findOne({ where: { email: normalizedEmail } });
    if (customer) {
      customer.password = hashedPassword;
      await customer.save();
      updated = true;
    }
  } else {
    // Search both
    const customer = await Customer.findOne({ where: { email: normalizedEmail } });
    if (customer) {
      customer.password = hashedPassword;
      await customer.save();
      updated = true;
    }
    const artist = await Artist.findOne({ where: { email: normalizedEmail } });
    if (artist) {
      artist.password = hashedPassword;
      await artist.save();
      updated = true;
    }
  }

  if (!updated) {
    throw new Error("Account not found. Could not update password.");
  }

  // Clean up OTP record
  await EmailOtp.destroy({ where: { email: normalizedEmail } });

  return {
    success: true,
    message: "Password reset successfully! You can now log in with your new password.",
  };
};
