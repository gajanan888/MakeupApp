import { Op } from "sequelize";
import bcrypt from "bcrypt";
import axios from "axios";
import sequelize from "../../config/db.js";
import Admin from "../../models/Admin.js";
import Customer from "../../models/Customer.js";
import Artist from "../../models/Artist.js";
import Booking from "../../models/Booking.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistCertificate from "../../models/ArtistCertificate.js";
import ArtistPortfolio from "../../models/ArtistPortfolio.js";
import ArtistPayment from "../../models/ArtistPayment.js";
import ActivityLog from "../../models/ActivityLog.js";

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

export const updateBookingStatus = async ({ bookingId, status, advancePaid, refundStatus, refundAmount }) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (status !== undefined) booking.status = status;
  if (advancePaid !== undefined) booking.advancePaid = advancePaid;
  if (refundStatus !== undefined) booking.refundStatus = refundStatus;
  if (refundAmount !== undefined) booking.refundAmount = refundAmount;
  
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

export const getTechHealth = async () => {
  // 1. Database connection & details
  let dbStatus = "healthy";
  let dbLatency = 0;
  let dbDialect = sequelize.getDialect();
  let dbError = null;

  try {
    const start = Date.now();
    await sequelize.authenticate();
    // run simple diagnostic select
    await sequelize.query("SELECT 1;");
    dbLatency = Date.now() - start;
  } catch (err) {
    dbStatus = "unhealthy";
    dbError = err.message;
  }

  const pool = sequelize.connectionManager.pool;
  const dbPool = pool ? {
    size: pool.size || 0,
    available: pool.available || 0,
    pending: pool.pending || 0,
  } : { size: 0, available: 0, pending: 0 };

  // 2. Storage check (Supabase Storage)
  const supabaseStorageConfigured = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY));
  let supabaseStorageStatus = "unconfigured";
  let supabaseStoragePing = "not configured";
  let supabaseStorageError = null;

  if (supabaseStorageConfigured) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.storage.listBuckets();
      if (!error) {
        supabaseStorageStatus = "healthy";
        supabaseStoragePing = "ok";
      } else {
        supabaseStorageStatus = "unhealthy";
        supabaseStorageError = error.message;
      }
    } catch (err) {
      supabaseStorageStatus = "unhealthy";
      supabaseStorageError = err.message;
    }
  }

  // 3. OTP check (2Factor)
  const otpConfigured = !!process.env.OTP_API_KEY;
  let otpStatus = "mock";
  let otpPing = "mocked (dev mode)";
  let otpError = null;

  if (otpConfigured) {
    try {
      const response = await axios.get(
        `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/BAL/SMS`,
        { timeout: 4000 }
      );
      if (response.data && response.data.Status === "Success") {
        otpStatus = "healthy";
        otpPing = response.data.Details || "active";
      } else {
        otpStatus = "unhealthy";
        otpPing = "failed response";
      }
    } catch (err) {
      otpStatus = "unhealthy";
      otpError = err.message;
    }
  }

  // 4. Payment Key validation
  const paymentKeyConfigured = !!process.env.PAYMENT_ENCRYPTION_KEY;
  const paymentStatus = paymentKeyConfigured ? "secure" : "warning_dev_key";

  // 5. System metrics & process info
  const systemMetrics = {
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || "development",
    uptimeSeconds: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };

  // 6. Database record stats summary
  const [customerCount, artistCount, bookingCount] = await Promise.all([
    Customer.count(),
    Artist.count(),
    Booking.count(),
  ]);

  return {
    database: {
      status: dbStatus,
      dialect: dbDialect,
      latencyMs: dbLatency,
      pool: dbPool,
      error: dbError,
      records: {
        customers: customerCount,
        artists: artistCount,
        bookings: bookingCount,
      }
    },
    supabaseStorage: {
      status: supabaseStorageStatus,
      configured: supabaseStorageConfigured,
      ping: supabaseStoragePing,
      error: supabaseStorageError,
    },
    otp: {
      status: otpStatus,
      configured: otpConfigured,
      ping: otpPing,
      error: otpError,
    },
    paymentEncryption: {
      status: paymentStatus,
      configured: paymentKeyConfigured,
    },
    system: systemMetrics,
  };
};

export const getActivityLogs = async ({ limit, offset, bookingId, userId, userType }) => {
  const where = {};
  if (bookingId) where.bookingId = Number(bookingId);
  if (userId) where.userId = Number(userId);
  if (userType) where.userType = userType;

  return ActivityLog.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
};
