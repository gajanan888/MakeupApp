import express from "express";
import {
  loginArtistController,
  registerArtistController,
} from "./artistAuth.controller.js";

const router = express.Router();

router.post("/register", registerArtistController);
router.post("/login", loginArtistController);

export default router;
