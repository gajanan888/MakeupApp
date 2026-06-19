import bcrypt from "bcrypt";
import { Op } from "sequelize";
import Customer from "../../models/Customer.js";
import generateToken from "../../utils/generateToken.js";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export const registerCustomer = async ({ name, email, phone, password }) => {
  if (!name?.trim())     throw new Error("Full name is required");
  if (!email?.trim())    throw new Error("Email address is required");
  if (!password?.trim()) throw new Error("Password is required");

  const normalizedEmail = email.trim().toLowerCase();

  const existingEmail = await Customer.findOne({ where: { email: normalizedEmail } });
  if (existingEmail) throw new Error("An account with this email already exists");

  if (phone?.trim()) {
    const existingPhone = await Customer.findOne({ where: { phone: phone.trim() } });
    if (existingPhone) throw new Error("An account with this phone number already exists");
  }

  const hashed = await bcrypt.hash(password, 10);

  const customer = await Customer.create({
    name:     name.trim(),
    email:    normalizedEmail,
    phone:    phone?.trim() || null,
    password: hashed,
  });

  return {
    id:    customer.id,
    name:  customer.name,
    email: customer.email,
    token: generateToken(customer.id),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN  (accepts email OR phone number)
// ─────────────────────────────────────────────────────────────────────────────
export const loginCustomer = async ({ email, password }) => {
  if (!email?.trim())    throw new Error("Email or phone number is required");
  if (!password?.trim()) throw new Error("Password is required");

  const input = email.trim();

  // Detect input type
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  const looksLikePhone = /^\+?[\d\s\-]{7,15}$/.test(input);

  let customer = null;

  if (looksLikeEmail) {
    customer = await Customer.findOne({ where: { email: input.toLowerCase() } });
  } else if (looksLikePhone) {
    const digits = input.replace(/\D/g, "");
    customer = await Customer.findOne({ where: { phone: { [Op.like]: `%${digits}` } } });
  } else {
    // Fallback: try both columns
    customer = await Customer.findOne({
      where: { [Op.or]: [{ email: input.toLowerCase() }, { phone: input }] },
    });
  }

  if (!customer) {
    throw new Error("No account found with this email or phone number");
  }

  const isMatch = await bcrypt.compare(password, customer.password);
  if (!isMatch) {
    throw new Error("Incorrect password. Please try again");
  }

  return {
    id:    customer.id,
    name:  customer.name,
    email: customer.email,
    token: generateToken(customer.id),
  };
};
