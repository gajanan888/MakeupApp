import express from "express";
import {
  getArtistProfileController,
  updateArtistProfileController,
  getArtistDashboardStatsController,
  getArtistScheduleController,
  createArtistBlockController,
} from "./artist.controller.js";
import { protectArtist } from "../../middleware/artistAuth.js";

const router = express.Router();

router.get("/profile", protectArtist, getArtistProfileController);
router.put("/profile", protectArtist, updateArtistProfileController);

router.get("/dashboard", protectArtist, getArtistDashboardStatsController);
router.get("/schedule", protectArtist, getArtistScheduleController);
router.post("/block", protectArtist, createArtistBlockController);

export default router;
