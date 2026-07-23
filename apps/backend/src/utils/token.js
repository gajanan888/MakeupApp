import crypto from "crypto";

/**
 * Generates a secure random verification token.
 * @returns {string} Plain token string
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hashes a plain token using SHA-256 for secure database storage.
 * @param {string} token Plain text token
 * @returns {string} SHA-256 hashed token
 */
export const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
};
