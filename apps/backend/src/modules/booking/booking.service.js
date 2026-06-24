import { Op } from "sequelize";
import Booking from "../../models/Booking.js";
import Artist from "../../models/Artist.js";
import Customer from "../../models/Customer.js";

// Helper to auto-expire bookings that missed their payment deadline
export const checkAndExpireBookings = async () => {
  const now = new Date();
  await Booking.update(
    {
      status: "cancelled",
      cancelledBy: "system",
      cancellationReason: "Advance payment deadline expired",
    },
    {
      where: {
        status: "accepted",
        paymentDeadline: {
          [Op.ne]: null,
          [Op.lt]: now,
        },
      },
    }
  );
};

export const createBooking = async ({ customerId, artistId, date, time, category, price, location, addOns, totalPaid }) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  // Check conflicting booking that is pending, accepted, or confirmed/in_progress
  const conflicting = await Booking.findOne({
    where: {
      artistId,
      date,
      time,
      status: {
        [Op.in]: ["pending", "accepted", "confirmed", "in_progress"],
      },
    },
  });

  if (conflicting) {
    throw new Error("Artist is not available at that time");
  }

  // Calculate 10% advance payment amount
  const advanceAmount = Math.round((price || 0) * 0.10);

  const booking = await Booking.create({
    customerId,
    artistId,
    date,
    time,
    category,
    price,
    location,
    addOns,
    totalPaid: 0,
    advanceAmount,
    advancePaid: false,
    status: "pending",
  });

  return booking;
};

export const listCustomerBookings = async ({ customerId, offset, limit }) => {
  await checkAndExpireBookings();
  return Booking.findAndCountAll({
    where: { customerId },
    include: [
      {
        model: Artist,
        as: "artist",
        attributes: ["id", "name"],
      },
    ],
    order: [
      ["date", "DESC"],
      ["time", "DESC"],
    ],
    offset,
    limit,
  });
};

export const listArtistBookings = async ({ artistId, offset, limit }) => {
  await checkAndExpireBookings();
  return Booking.findAndCountAll({
    where: { artistId },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
    ],
    order: [
      ["date", "DESC"],
      ["time", "DESC"],
    ],
    offset,
    limit,
  });
};

export const acceptBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "pending") {
    throw new Error("Only pending bookings can be accepted");
  }

  booking.status = "accepted";
  await booking.save();

  return booking;
};

export const rejectBooking = async ({ bookingId, artistId, reason }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "pending") {
    throw new Error("Only pending bookings can be rejected");
  }

  booking.status = "rejected";
  booking.rejectionReason = reason || "No reason specified";
  await booking.save();

  return booking;
};

export const payAdvance = async ({ bookingId, customerId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "accepted") {
    throw new Error("Payment can only be made for accepted bookings");
  }

  booking.status = "confirmed";
  booking.advancePaid = true;
  booking.totalPaid = booking.advanceAmount;
  booking.paymentDeadline = null; // Clear timer
  await booking.save();

  return booking;
};

export const declineAdvancePayment = async ({ bookingId, customerId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "accepted") {
    throw new Error("Can only decline payment for accepted bookings");
  }

  // Set 30-minute deadline from now
  booking.paymentDeadline = new Date(Date.now() + 30 * 60 * 1000);
  await booking.save();

  return booking;
};

export const cancelBooking = async ({ bookingId, customerId, artistId, reason }) => {
  // Can be cancelled by either customer or artist
  const where = { id: bookingId };
  if (customerId) where.customerId = customerId;
  if (artistId) where.artistId = artistId;

  const booking = await Booking.findOne({ where });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Allow cancellation of pending/accepted bookings normally
  if (["pending", "accepted"].includes(booking.status)) {
    booking.status = "cancelled";
    booking.cancelledBy = customerId ? "client" : "artist";
    booking.cancellationReason = reason || "Cancelled before confirmation";
    await booking.save();
    return booking;
  }

  // If already confirmed (paid)
  if (booking.status === "confirmed") {
    // Parse service date and time to check 36-hour limit
    // Example booking.date = "2026-06-25", booking.time = "09:00 AM"
    let hours = 12;
    let minutes = 0;
    if (booking.time) {
      const parts = booking.time.split(" ");
      const timeStr = parts[0];
      const ampm = parts[1] || "AM";
      const [h, m] = timeStr.split(":").map(Number);
      hours = h;
      minutes = m;
      if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    const serviceDate = new Date(`${booking.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    const now = new Date();
    const diffHours = (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 36) {
      throw new Error("Cancellation is only allowed up to 36 hours before the service time.");
    }

    const serviceCharge = Math.round((booking.price || 0) * 0.02);

    if (customerId) {
      // Cancelled by client: gets refund of advance - 2% service charge
      booking.status = "cancelled";
      booking.cancelledBy = "client";
      booking.cancellationReason = reason || "Client cancelled before 36h limit";
      booking.refundAmount = Math.max(0, (booking.advanceAmount || 0) - serviceCharge);
      booking.refundStatus = "refunded";
    } else {
      // Cancelled by artist: client gets full refund, artist charged 2% (logged)
      booking.status = "cancelled";
      booking.cancelledBy = "artist";
      booking.cancellationReason = reason || "Artist cancelled before 36h limit. Artist charged 2% fee.";
      booking.refundAmount = booking.advanceAmount || 0;
      booking.refundStatus = "refunded";
    }

    await booking.save();
    return booking;
  }

  throw new Error("Booking cannot be cancelled in its current state.");
};

export const startBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can be started");
  }

  booking.status = "in_progress";
  await booking.save();

  return booking;
};

export const completeBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "in_progress") {
    throw new Error("Only in-progress bookings can be completed");
  }

  booking.status = "completed";
  // When completed, they pay the rest. Let's set totalPaid to full price.
  booking.totalPaid = booking.price;
  await booking.save();

  return booking;
};
