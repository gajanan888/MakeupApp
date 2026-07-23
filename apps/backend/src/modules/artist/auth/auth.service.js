import bcrypt from "bcrypt";
import Artist from "../../../models/Artist.js";
import EmailOtp from "../../../models/EmailOtp.js";
import generateToken from "../../../utils/generateToken.js";
import { generateRandomToken, hashToken } from "../../../utils/token.js";
import { sendVerificationEmail } from "../../../services/email.service.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

/**
 * Generate and send a 6-digit Email OTP before account creation.
 * @param {Object} payload Email and Name
 * @returns {Promise<Object>} Status message
 */
export const sendEmailOtp = async ({ email, name }) => {
  if (!email || !email.trim()) {
    throw new Error("Email address is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if artist already exists
  const existing = await Artist.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error("Artist already exists");
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  // Upsert the code in EmailOtp table
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

  // Send the email containing the OTP code
  await sendVerificationEmail(normalizedEmail, name, verificationCode);

  return {
    message: "Verification code sent to your email.",
  };
};

/**
 * Register a new artist after successful email OTP verification.
 * @param {Object} data Artist input details including emailOtpCode
 * @returns {Promise<Object>} Created artist data and JWT token
 */
export const registerArtist = async (data) => {
  const { name, email, phone, password, pricing, experience, emailOtpCode } = data;

  if (!emailOtpCode || !emailOtpCode.trim()) {
    throw new Error("Email verification code is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await Artist.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error("Artist already exists");
  }

  if (phone) {
    const phoneExists = await Artist.findOne({ where: { phone } });
    if (phoneExists) {
      throw new Error("Phone already in use");
    }
  }

  // Verify the OTP code against EmailOtp table
  const otpRecord = await EmailOtp.findOne({ where: { email: normalizedEmail } });
  if (!otpRecord || otpRecord.otp !== emailOtpCode.trim()) {
    throw new Error("Invalid verification code");
  }

  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new Error("Verification code has expired. Please request a new one");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const artist = await Artist.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password: hashedPassword,
    pricing,
    experience,
    isEmailVerified: true, // Activated immediately since code was checked
    isVerified: true, // Sync for database compatibility
  });

  // Delete the verified OTP record
  await otpRecord.destroy();

  const artistData = artist.toJSON();
  delete artistData.password;

  return {
    artist: artistData,
    token: generateToken(artist.id),
  };
};

/**
 * Verify artist's email using 6-digit OTP code (compat utility).
 * @param {Object} payload Email and 6-digit OTP code
 * @returns {Promise<Object>} Verification status message and updated artist object
 */
export const verifyArtistEmail = async ({ email, code }) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }
  if (!code || !code.trim()) {
    throw new Error("Verification code is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const artist = await Artist.findOne({
    where: { email: normalizedEmail },
  });

  if (artist) {
    if (artist.isEmailVerified) {
      return {
        message: "Email is already verified",
        artist: artist.toJSON(),
      };
    }
  }

  // Verify using EmailOtp table (incase called separately)
  const otpRecord = await EmailOtp.findOne({ where: { email: normalizedEmail } });
  if (!otpRecord || otpRecord.otp !== code.trim()) {
    throw new Error("Invalid verification code");
  }

  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new Error("Verification code has expired. Please request a new one");
  }

  if (artist) {
    artist.isEmailVerified = true;
    artist.isVerified = true;
    await artist.save();
  }

  await otpRecord.destroy();

  return {
    message: "Email successfully verified",
    artist: artist ? artist.toJSON() : null,
  };
};

/**
 * Resend email verification code.
 * @param {string} email Target artist email
 * @returns {Promise<Object>} Status message
 */
export const resendArtistVerification = async ({ email }) => {
  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const artist = await Artist.findOne({ where: { email: normalizedEmail } });

  if (artist && artist.isEmailVerified) {
    throw new Error("Email is already verified");
  }

  // Generate new 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

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

  await sendVerificationEmail(normalizedEmail, artist?.name || "Artist", verificationCode);

  return {
    message: "A new verification code has been sent to your email address",
  };
};

/**
 * Authenticate artist login.
 * @param {Object} credentials Email and password
 * @returns {Promise<Object>} Authenticated artist data and JWT token
 */
export const loginArtist = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const artist = await Artist.findOne({ where: { email: normalizedEmail } });

  if (!artist) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, artist.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Prevent login if email is not verified
  if (!artist.isEmailVerified) {
    throw new Error("Please verify your email address before logging in");
  }

  const artistData = artist.toJSON();
  delete artistData.password;

  return {
    artist: artistData,
    token: generateToken(artist.id),
  };
};
