import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";

export const protectCustomer = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.customer = await Customer.findByPk(decoded.id);
    next();
  } else {
    res.status(401).json({ message: "Not authorized" });
  }
};
