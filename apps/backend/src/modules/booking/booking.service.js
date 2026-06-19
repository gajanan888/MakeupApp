import { Op } from "sequelize";
import Booking from "../../models/Booking.js";
import Artist from "../../models/Artist.js";
import Customer from "../../models/Customer.js";

export const createBooking = async ({ customerId, artistId, date, time, category, price, location, addOns, totalPaid }) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  const conflicting = await Booking.findOne({
    where: {
      artistId,
      date,
      time,
      status: {
        [Op.in]: ["pending", "accepted"],
      },
    },
  });

  if (conflicting) {
    throw new Error("Artist is not available at that time");
  }

  const booking = await Booking.create({
    customerId,
    artistId,
    date,
    time,
    category,
    price,
    location,
    addOns,
    totalPaid,
    status: "pending",
  });

  return booking;
};

export const listCustomerBookings = async ({ customerId, offset, limit }) => {
  return Booking.findAndCountAll({
    where: { customerId },
    include: [
      {
        model: Artist,
        as: "artist",
        attributes: ["id", "name", "pricing", "experience"],
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

export const cancelBooking = async ({ bookingId, customerId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!["pending", "accepted"].includes(booking.status)) {
    throw new Error("Booking cannot be cancelled");
  }

  booking.status = "cancelled";
  await booking.save();

  return booking;
};

export const listArtistBookings = async ({ artistId, offset, limit }) => {
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

export const rejectBooking = async ({ bookingId, artistId }) => {
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
  await booking.save();

  return booking;
};

export const startBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "accepted") {
    throw new Error("Only accepted bookings can be started");
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
  await booking.save();

  return booking;
};
