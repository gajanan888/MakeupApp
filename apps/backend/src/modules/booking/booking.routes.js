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
  createRazorpayOrderController,
  verifyPaymentController,
  razorpayWebhookController,
  getArtistBookedSlotsController,
  addExtraClientsController,
  createArtistDirectBookingController,
} from "./booking.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";
import { protectArtist } from "../../middleware/artistAuth.js";
import { rateLimiter } from "../../middleware/rateLimiter.js";

const paymentLimiter = rateLimiter({ limit: 5, windowMs: 60000 });

const router = express.Router();

router.post("/", protectCustomer, createBookingController);
router.get("/customer", protectCustomer, listCustomerBookingsController);
router.patch("/:id/cancel", protectCustomer, cancelBookingController);
router.post("/:id/pay-advance", protectCustomer, paymentLimiter, payAdvanceController);
router.post("/:id/razorpay-order", protectCustomer, paymentLimiter, createRazorpayOrderController);
router.post("/:id/verify-payment", protectCustomer, paymentLimiter, verifyPaymentController);
router.post("/webhook/razorpay", express.json({ type: 'application/json' }), razorpayWebhookController);

router.post("/:id/decline-advance", protectCustomer, declineAdvancePaymentController);
router.get("/artist/:artistId/booked-slots", protectCustomer, getArtistBookedSlotsController);

router.get("/artist", protectArtist, listArtistBookingsController);
router.patch("/:id/accept", protectArtist, acceptBookingController);
router.patch("/:id/reject", protectArtist, rejectBookingController);
router.patch("/:id/cancel-by-artist", protectArtist, cancelBookingController);
router.patch("/:id/start", protectArtist, startBookingController);
router.patch("/:id/complete", protectArtist, completeBookingController);
router.patch("/:id/add-clients", protectArtist, addExtraClientsController);
router.post("/artist-direct", protectArtist, createArtistDirectBookingController);

export default router;
