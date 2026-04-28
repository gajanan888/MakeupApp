import express from "express";
import {
  registerCustomerController,
  loginCustomerController,
} from "./auth.controller.js";

const router = express.Router();

router.post("/customer/register", registerCustomerController);
router.post("/customer/login", loginCustomerController);

export default router;
