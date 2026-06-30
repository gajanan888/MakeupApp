import {
  acceptBooking,
  cancelBooking,
  createBooking,
  listArtistBookings,
  listCustomerBookings,
  rejectBooking,
  startBooking,
  completeBooking,
  payAdvance,
  declineAdvancePayment,
  createRazorpayOrderService,
  verifyPaymentService,
  handleRazorpayWebhookService,
  getArtistBookedSlots,
} from "./booking.service.js";
import { verifyWebhookSignature } from "../../utils/razorpay.js";
import {
  getPagination,
  validateCreateBooking,
} from "../../validators/booking.validator.js";
import { logActivity } from "../../utils/activityLogger.js";

export const createBookingController = async (req, res) => {
  try {
    const { errors, parsedArtistId } = validateCreateBooking(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: { errors },
      });
    }

    const booking = await createBooking({
      customerId: req.customer.id,
      artistId: parsedArtistId,
      date: req.body.date,
      time: req.body.time,
      category: req.body.category,
      price: req.body.price,
      location: req.body.location,
      addOns: req.body.addOns,
      totalPaid: req.body.totalPaid,
    });

    await logActivity({
      userId: req.customer.id,
      userType: "customer",
      userName: req.customer.name,
      action: "BOOKING_CREATE",
      bookingId: booking.id,
      details: `Created a booking for '${booking.category}' on ${booking.date} at ${booking.time} for total ₹${booking.totalPaid || 0}.`,
      req,
    });

    res.status(201).json({
      success: true,
      message: "Booking created",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create booking",
      data: null,
    });
  }
};

export const listCustomerBookingsController = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const result = await listCustomerBookings({
      customerId: req.customer.id,
      offset,
      limit,
    });

    res.json({
      success: true,
      message: "Bookings fetched",
      data: {
        items: result.rows,
        total: result.count,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
      data: null,
    });
  }
};

export const cancelBookingController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    const isArtist = req.userRole === "artist";
    const booking = await cancelBooking({
      bookingId,
      customerId: isArtist ? null : req.customer.id,
      artistId: isArtist ? req.artist.id : null,
      reason: req.body?.reason,
    });

    await logActivity({
      userId: isArtist ? req.artist.id : req.customer.id,
      userType: isArtist ? "artist" : "customer",
      userName: isArtist ? req.artist.name : req.customer.name,
      action: "BOOKING_CANCEL",
      bookingId: booking.id,
      details: `Cancelled booking. Reason: ${req.body?.reason || "Not specified"}.`,
      req,
    });

    res.json({
      success: true,
      message: "Booking cancelled",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel booking",
      data: null,
    });
  }
};

export const listArtistBookingsController = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const result = await listArtistBookings({
      artistId: req.artist.id,
      offset,
      limit,
    });

    res.json({
      success: true,
      message: "Bookings fetched",
      data: {
        items: result.rows,
        total: result.count,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
      data: null,
    });
  }
};

export const acceptBookingController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    const booking = await acceptBooking({
      bookingId,
      artistId: req.artist.id,
    });

    await logActivity({
      userId: req.artist.id,
      userType: "artist",
      userName: req.artist.name,
      action: "BOOKING_ACCEPT",
      bookingId: booking.id,
      details: `Accepted booking request for '${booking.category || "service"}'.`,
      req,
    });

    res.json({
      success: true,
      message: "Booking accepted",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to accept booking",
      data: null,
    });
  }
};

export const rejectBookingController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    const booking = await rejectBooking({
      bookingId,
      artistId: req.artist.id,
      reason: req.body?.reason,
    });

    await logActivity({
      userId: req.artist.id,
      userType: "artist",
      userName: req.artist.name,
      action: "BOOKING_REJECT",
      bookingId: booking.id,
      details: `Rejected booking request. Reason: ${req.body?.reason || "Not specified"}.`,
      req,
    });

    res.json({
      success: true,
      message: "Booking rejected",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject booking",
      data: null,
    });
  }
};

export const payAdvanceController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await payAdvance({
      bookingId,
      customerId: req.customer.id,
    });

    await logActivity({
      userId: req.customer.id,
      userType: "customer",
      userName: req.customer.name,
      action: "PAYMENT_ADVANCE",
      bookingId: booking.id,
      details: `Successfully paid advance amount of ₹${booking.advanceAmount || 0} for booking (Legacy).`,
      req,
    });

    res.json({
      success: true,
      message: "Advance payment successful. Booking confirmed.",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Advance payment failed",
      data: null,
    });
  }
};

export const createRazorpayOrderController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid booking id" });
    }

    const orderData = await createRazorpayOrderService({
      bookingId,
      customerId: req.customer.id,
    });

    await logActivity({
      userId: req.customer.id,
      userType: "customer",
      userName: req.customer.name,
      action: "RAZORPAY_ORDER_CREATED",
      bookingId,
      details: `Created or reused Razorpay order ${orderData.orderId} for ₹${orderData.amount}`,
      req,
    });

    res.json({
      success: true,
      message: "Razorpay order created successfully",
      data: orderData,
    });
  } catch (error) {
    const errorMsg = error.error?.description || error.description || error.message || "Failed to create Razorpay order";
    res.status(400).json({
      success: false,
      message: errorMsg,
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid booking id" });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing payment details in request body" });
    }

    // Since we're using createHmac with secret directly in Razorpay's verify signature,
    // we need to verify the signature first.
    // The verifyRazorpaySignature is exported from utils/razorpay.js
    // We already have it, let's just import it or just call verifyRazorpaySignature.
    // Actually, I didn't export it in this file. Let me import it at the top.
    const { verifyRazorpaySignature } = await import("../../utils/razorpay.js");
    
    if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const booking = await verifyPaymentService({
      bookingId,
      customerId: req.customer.id,
      razorpayOrderId,
      razorpayPaymentId,
    });

    await logActivity({
      userId: req.customer.id,
      userType: "customer",
      userName: req.customer.name,
      action: "RAZORPAY_PAYMENT_VERIFIED",
      bookingId: booking.id,
      details: `Successfully verified Razorpay payment ${razorpayPaymentId}. Booking confirmed.`,
      req,
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

export const razorpayWebhookController = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(401).json({ success: false, message: "Missing signature" });
    }

    const bodyString = JSON.stringify(req.body);
    if (!verifyWebhookSignature(bodyString, signature)) {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body.event;
    const result = await handleRazorpayWebhookService(event, req.body.payload);

    if (result.ignored) {
      console.log(`[PaymentService] Webhook ignored: ${result.message || event}`);
    } else {
      console.log(`[PaymentService] Webhook processed successfully for event ${event}`);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("[PaymentService] Webhook processing failed:", error.message);
    // Return 200 so razorpay doesn't retry unnecessarily for non-transient errors, 
    // unless it's a DB issue. We will just return 200 to acknowledge.
    res.status(200).send("OK");
  }
};

export const declineAdvancePaymentController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await declineAdvancePayment({
      bookingId,
      customerId: req.customer.id,
    });

    await logActivity({
      userId: req.customer.id,
      userType: "customer",
      userName: req.customer.name,
      action: "PAYMENT_DECLINE",
      bookingId: booking.id,
      details: `Declined advance payment request.`,
      req,
    });

    res.json({
      success: true,
      message: "Payment declined, 30-minute timer started.",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to decline advance payment",
      data: null,
    });
  }
};

export const startBookingController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    const booking = await startBooking({
      bookingId,
      artistId: req.artist.id,
    });

    await logActivity({
      userId: req.artist.id,
      userType: "artist",
      userName: req.artist.name,
      action: "BOOKING_START",
      bookingId: booking.id,
      details: `Started service appointment with customer (ID: ${booking.customerId}).`,
      req,
    });

    res.json({
      success: true,
      message: "Booking started",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to start booking",
      data: null,
    });
  }
};

export const completeBookingController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    const booking = await completeBooking({
      bookingId,
      artistId: req.artist.id,
    });

    await logActivity({
      userId: req.artist.id,
      userType: "artist",
      userName: req.artist.name,
      action: "BOOKING_COMPLETE",
      bookingId: booking.id,
      details: `Completed booking appointment. Balance settled.`,
      req,
    });

    res.json({
      success: true,
      message: "Booking completed",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to complete booking",
      data: null,
    });
  }
};

export const getArtistBookedSlotsController = async (req, res) => {
  try {
    const artistId = Number(req.params.artistId);
    if (!Number.isInteger(artistId) || artistId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist id",
        data: null,
      });
    }

    const bookedSlots = await getArtistBookedSlots(artistId);

    res.json({
      success: true,
      message: "Artist booked slots retrieved",
      data: bookedSlots,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to retrieve booked slots",
      data: null,
    });
  }
};
