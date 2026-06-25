import { loginAdmin, registerAdmin } from "./auth.service.js";
import { validateAdminRegister } from "../../validators/admin.validator.js";
import { logActivity } from "../../utils/activityLogger.js";

const isBootstrapAllowed = (req) => {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!secret) {
    return false;
  }

  return req.headers["x-admin-secret"] === secret;
};

export const registerAdminController = async (req, res) => {
  try {
    if (!isBootstrapAllowed(req)) {
      return res.status(403).json({
        success: false,
        message: "Admin bootstrap not allowed",
        data: null,
      });
    }

    const errors = validateAdminRegister(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: { errors },
      });
    }

    const data = await registerAdmin(req.body);
    res.status(201).json({
      success: true,
      message: "Admin registered",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Admin registration failed",
      data: null,
    });
  }
};

export const loginAdminController = async (req, res) => {
  try {
    const data = await loginAdmin(req.body);

    if (data?.admin) {
      await logActivity({
        userId: data.admin.id,
        userType: "admin",
        userName: data.admin.name,
        action: "ADMIN_LOGIN",
        details: `Logged into the administrative dashboard with role: ${data.admin.role}.`,
        req,
      });
    }

    res.json({
      success: true,
      message: "Admin login successful",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Admin login failed",
      data: null,
    });
  }
};
