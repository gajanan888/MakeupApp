import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "enc:";
const DEFAULT_DEV_KEY = "dev-only-payment-encryption-key-32b";

const getKey = () => {
  const rawKey = process.env.PAYMENT_ENCRYPTION_KEY || DEFAULT_DEV_KEY;

  if (
    !process.env.PAYMENT_ENCRYPTION_KEY &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error("PAYMENT_ENCRYPTION_KEY is required in production");
  }

  return crypto.createHash("sha256").update(String(rawKey)).digest();
};

const isEncrypted = (value) =>
  typeof value === "string" && value.startsWith(PREFIX);

export const encryptSensitiveValue = (value) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  if (isEncrypted(value)) {
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSensitiveValue = (value) => {
  if (!isEncrypted(value)) {
    return value;
  }

  const payload = value.slice(PREFIX.length);
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted payment value");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

export const maskAccountNumber = (value) => {
  if (!value) {
    return value;
  }

  const plainValue = decryptSensitiveValue(value);
  const accountNumber = String(plainValue);

  if (accountNumber.length <= 4) {
    return accountNumber;
  }

  return `${"X".repeat(Math.max(accountNumber.length - 4, 0))}${accountNumber.slice(-4)}`;
};

export const maskIfscCode = (value) => {
  if (!value) {
    return value;
  }

  const plainValue = decryptSensitiveValue(value);
  const ifscCode = String(plainValue);

  if (ifscCode.length <= 4) {
    return ifscCode;
  }

  return `${ifscCode.slice(0, 4)}${"X".repeat(Math.max(ifscCode.length - 4, 0))}`;
};
