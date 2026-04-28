import validator from "validator";
import Customer from "../../models/Customer.js";
import { getArtists } from "./customer.service.js";

export const getProfile = async (req, res) => {
  try {
    const { password, ...customerData } = req.customer.toJSON();
    res.json(customerData);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const customer = req.customer;
    const { name, email, phone } = req.body;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      customer.name = trimmedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();

      if (!validator.isEmail(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      const existingCustomer = await Customer.findOne({
        where: { email: normalizedEmail },
      });

      if (existingCustomer && existingCustomer.id !== customer.id) {
        return res.status(400).json({ message: "Email already in use" });
      }

      customer.email = normalizedEmail;
    }

    if (phone !== undefined) {
      const normalizedPhone = String(phone).trim();
      const digitsOnly = normalizedPhone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        return res
          .status(400)
          .json({ message: "Phone must be at least 10 digits" });
      }
      customer.phone = normalizedPhone;
    }

    const updatedCustomer = await customer.save();
    const { password, ...customerData } = updatedCustomer.toJSON();

    res.json({
      success: true,
      message: "Profile updated",
      data: customerData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to update profile" });
  }
};

export const getArtistsController = async (req, res) => {
  try {
    const artists = await getArtists(req.query);

    res.json({
      success: true,
      message: "Artists fetched successfully",
      data: artists,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to fetch artists" });
  }
};
