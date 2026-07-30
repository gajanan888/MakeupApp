import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";

// Protects routes that require a logged-in Customer
export const protectCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized — no token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      const secret = process.env.JWT_SECRET || "makeup_app_jwt_secret_dev_key_2026";
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({ success: false, message: "Session expired — please log in again" });
    }

    const customer = await Customer.findByPk(decoded.id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Account not found — please log in again" });
    }

    req.customer = customer;
    next();
  } catch (err) {
    console.error("[authMiddleware] protectCustomer error:", err.message);
    res.status(500).json({ success: false, message: "Authentication error" });
  }
};
