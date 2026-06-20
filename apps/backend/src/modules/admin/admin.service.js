import { Op } from "sequelize";
import bcrypt from "bcrypt";
import Admin from "../../models/Admin.js";
import Customer from "../../models/Customer.js";
import Artist from "../../models/Artist.js";
import Booking from "../../models/Booking.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistCertificate from "../../models/ArtistCertificate.js";
import ArtistPortfolio from "../../models/ArtistPortfolio.js";
import ArtistPayment from "../../models/ArtistPayment.js";

export const getAdminProfile = async (adminId) => {
  const admin = await Admin.findByPk(adminId, {
    attributes: ["id", "name", "email"],
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  return admin;
};

export const changeAdminPassword = async (
  adminId,
  { currentPassword, newPassword },
) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw new Error("Admin not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) {
    throw new Error("Invalid current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  admin.password = hashedPassword;
  await admin.save();

  return true;
};

export const listCustomers = async ({ q, offset, limit }) => {
  const where = {};

  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return Customer.findAndCountAll({
    attributes: ["id", "name", "email", "phone", "createdAt"],
    where,
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });
};

export const listArtists = async ({ q, offset, limit }) => {
  const where = {};

  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } },
    ];
  }

  return Artist.findAndCountAll({
    where,
    include: [
      { model: ArtistProfile, as: "profile" },
      { model: ArtistCertificate, as: "certificates" },
      { model: ArtistPortfolio, as: "portfolio" },
      { model: ArtistPayment, as: "payment" },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });
};

export const listBookings = async ({
  status,
  customerId,
  artistId,
  dateFrom,
  dateTo,
  offset,
  limit,
}) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (artistId) {
    where.artistId = artistId;
  }

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) {
      where.date[Op.gte] = dateFrom;
    }
    if (dateTo) {
      where.date[Op.lte] = dateTo;
    }
  }

  return Booking.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: Artist,
        as: "artist",
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

export const updateBookingStatus = async ({ bookingId, status }) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  booking.status = status;
  await booking.save();

  return booking;
};

export const getDashboardAnalytics = async () => {
  const [customerCount, artistCount, bookingCount] = await Promise.all([
    Customer.count(),
    Artist.count(),
    Booking.count(),
  ]);

  const byStatus = await Booking.findAll({
    attributes: ["status", [Booking.sequelize.fn("COUNT", "status"), "count"]],
    group: ["status"],
  });

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const bookingsLast30Days = await Booking.count({
    where: {
      createdAt: {
        [Op.gte]: last30Days,
      },
    },
  });

  return {
    customers: customerCount,
    artists: artistCount,
    bookings: bookingCount,
    bookingsLast30Days,
    bookingsByStatus: byStatus.map((row) => ({
      status: row.status,
      count: Number(row.get("count")),
    })),
  };
};

export const verifyArtist = async (artistId, isVerified) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  artist.isVerified = Boolean(isVerified);
  await artist.save();

  return artist;
};
