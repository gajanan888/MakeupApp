import express from "express";
import {
  createReviewController,
  getArtistReviewsController,
} from "./review.controller.js";
import { protectCustomer, protectCustomerOrArtist } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id/review", protectCustomer, createReviewController);
router.get("/artist/:artistId/reviews", protectCustomerOrArtist, getArtistReviewsController);

export default router;

