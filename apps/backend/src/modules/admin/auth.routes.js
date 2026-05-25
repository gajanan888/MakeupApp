import express from "express";
import {
  loginAdminController,
  registerAdminController,
} from "./auth.controller.js";

const router = express.Router();

router.post("/register", registerAdminController);
router.post("/login", loginAdminController);

export default router;
