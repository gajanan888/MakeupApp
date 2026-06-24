import express from "express";
import {
  acceptBookingController,
  cancelBookingController,
  createBookingController,
  listCustomerBookingsController,
  listArtistBookingsController,
  rejectBookingController,
  startBookingController,
  completeBookingController,
  payAdvanceController,
  declineAdvancePaymentController,
} from "./booking.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";
import { protectArtist } from "../../middleware/artistAuth.js";

const router = express.Router();

router.post("/", protectCustomer, createBookingController);
router.get("/customer", protectCustomer, listCustomerBookingsController);
router.patch("/:id/cancel", protectCustomer, cancelBookingController);
router.post("/:id/pay-advance", protectCustomer, payAdvanceController);
router.post("/:id/decline-advance", protectCustomer, declineAdvancePaymentController);

router.get("/artist", protectArtist, listArtistBookingsController);
router.patch("/:id/accept", protectArtist, acceptBookingController);
router.patch("/:id/reject", protectArtist, rejectBookingController);
router.patch("/:id/cancel-by-artist", protectArtist, cancelBookingController);
router.patch("/:id/start", protectArtist, startBookingController);
router.patch("/:id/complete", protectArtist, completeBookingController);

export default router;
