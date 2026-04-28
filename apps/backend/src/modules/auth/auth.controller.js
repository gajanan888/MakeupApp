import { registerCustomer, loginCustomer } from "./auth.service.js";

export const registerCustomerController = async (req, res) => {
  try {
    const data = await registerCustomer(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const loginCustomerController = async (req, res) => {
  try {
    const data = await loginCustomer(req.body);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
