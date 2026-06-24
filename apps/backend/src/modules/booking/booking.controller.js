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
} from "./booking.service.js";
import {
  getPagination,
  validateCreateBooking,
} from "../../validators/booking.validator.js";

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

    const booking = await cancelBooking({
      bookingId,
      customerId: req.userRole === "artist" ? null : req.customer.id,
      artistId: req.userRole === "artist" ? req.artist.id : null,
      reason: req.body?.reason,
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

export const declineAdvancePaymentController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const booking = await declineAdvancePayment({
      bookingId,
      customerId: req.customer.id,
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
