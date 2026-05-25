import express from "express";
import {
  acceptBookingController,
  cancelBookingController,
  createBookingController,
  listCustomerBookingsController,
  listArtistBookingsController,
  rejectBookingController,
} from "./booking.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";
import { protectArtist } from "../../middleware/artistAuth.js";

const router = express.Router();

router.post("/", protectCustomer, createBookingController);
router.get("/customer", protectCustomer, listCustomerBookingsController);
router.patch("/:id/cancel", protectCustomer, cancelBookingController);

router.get("/artist", protectArtist, listArtistBookingsController);
router.patch("/:id/accept", protectArtist, acceptBookingController);
router.patch("/:id/reject", protectArtist, rejectBookingController);

export default router;
