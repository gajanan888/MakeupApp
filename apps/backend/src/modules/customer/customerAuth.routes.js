import express from "express";
import {
  loginCustomerController,
  registerCustomerController,
} from "./customerAuth.controller.js";

const router = express.Router();

router.post("/register", registerCustomerController);
router.post("/login", loginCustomerController);

export default router;
