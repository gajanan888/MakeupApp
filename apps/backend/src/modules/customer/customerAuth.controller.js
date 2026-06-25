import { loginCustomer, registerCustomer } from "./customerAuth.service.js";
import { logActivity } from "../../utils/activityLogger.js";

export const registerCustomerController = async (req, res) => {
  try {
    const data = await registerCustomer(req.body);
    
    // Log activity
    if (data?.customer) {
      await logActivity({
        userId: data.customer.id,
        userType: "customer",
        userName: data.customer.name,
        action: "CUSTOMER_REGISTER",
        details: "Registered a new customer account.",
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: "Customer registered",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Customer registration failed",
      data: null,
    });
  }
};

export const loginCustomerController = async (req, res) => {
  try {
    const data = await loginCustomer(req.body);

    // Log activity
    if (data?.customer) {
      await logActivity({
        userId: data.customer.id,
        userType: "customer",
        userName: data.customer.name,
        action: "CUSTOMER_LOGIN",
        details: "Logged into the application.",
        req,
      });
    }

    res.json({
      success: true,
      message: "Customer login successful",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Customer login failed",
      data: null,
    });
  }
};
