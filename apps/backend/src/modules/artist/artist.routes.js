import express from "express";
import {
  getArtistProfileController,
  updateArtistProfileController,
} from "./artist.controller.js";
import { protectArtist } from "../../middleware/artistAuth.js";

const router = express.Router();

router.get("/profile", protectArtist, getArtistProfileController);
router.put("/profile", protectArtist, updateArtistProfileController);

export default router;
