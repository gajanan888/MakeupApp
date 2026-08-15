import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import sequelize from "./src/config/db.js";
import routes from "./src/routes/index.js";
import initSocketServer from "./src/socket/index.js";
import EmailOtp from "./src/models/EmailOtp.js";
import { checkAndExpireBookings } from "./src/modules/booking/booking.service.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());

// ── Proxy to FastAPI AI Backend ───────────────────────────────────────────────
// IMPORTANT: These MUST come before express.json() / express.urlencoded().
// Body parsers consume the raw stream; if they run first, multipart uploads
// arrive at FastAPI with an empty body and the upload hangs indefinitely.

const makeProxy = (pathPrefix) => (req, res) => {
  const options = {
    hostname: "127.0.0.1",
    port: 8000,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers },
  };
  delete options.headers["host"];

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`[Proxy Error] ${pathPrefix} – FastAPI unreachable:`, err.message);
    if (!res.headersSent) res.status(502).send("Bad Gateway: AI Backend is offline");
  });

  req.pipe(proxyReq, { end: true });
};

app.use("/api/v1", makeProxy("/api/v1"));
app.use("/api/artist/upload-portfolio", makeProxy("/api/artist/upload-portfolio"));
app.use("/api/artist/recommend", makeProxy("/api/artist/recommend"));
app.use("/generated", makeProxy("/generated"));
app.use("/uploads", makeProxy("/uploads"));

// Body parsers for all other Express routes
app.use(express.json());

app.use("/api", routes);

async function bootstrapDatabase() {
  try {
    await sequelize.authenticate();
    console.log("DB CONNECTED");

    if (process.env.NODE_ENV === "production") {
      console.log(
        "Production mode: ensure migrations are run with `npm run migrate` before starting. Skipping sequelize.sync()",
      );
      return;
    }

    // Keep development startup resilient when the database is unavailable.
    try {
      await sequelize.sync();
    } catch (syncErr) {
      console.warn("sequelize.sync() warning (schema already synchronized or network reset):", syncErr.message);
    }

    // TEMPORARY FIX: Inject missing Razorpay columns into Supabase because migrations got out of sync
    const qi = sequelize.getQueryInterface();
    try { await qi.addColumn("Bookings", "date", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "time", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "category", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "price", { type: "INTEGER", defaultValue: 0 }); } catch (e) {}
    try { await qi.addColumn("Bookings", "status", { type: "VARCHAR(255)", defaultValue: "pending" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "location", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "addOns", { type: "TEXT" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "totalPaid", { type: "INTEGER", defaultValue: 0 }); } catch (e) {}
    try { await qi.addColumn("Bookings", "rejectionReason", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "advanceAmount", { type: "INTEGER", defaultValue: 0 }); } catch (e) {}
    try { await qi.addColumn("Bookings", "hasInsurance", { type: "BOOLEAN", defaultValue: false }); } catch (e) {}
    try { await qi.addColumn("Bookings", "insuranceFee", { type: "INTEGER", defaultValue: 0 }); } catch (e) {}
    try { await qi.addColumn("Bookings", "advancePaid", { type: "BOOLEAN", defaultValue: false }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentDeadline", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "cancelledBy", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "cancellationReason", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "refundAmount", { type: "INTEGER", defaultValue: 0 }); } catch (e) {}
    try { await qi.addColumn("Bookings", "refundStatus", { type: "VARCHAR(255)", defaultValue: "none" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "razorpayOrderId", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "razorpayPaymentId", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentStatus", { type: "VARCHAR(255)", allowNull: false, defaultValue: "unpaid" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentMethod", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paidAt", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentFailureReason", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentGateway", { type: "VARCHAR(255)", allowNull: false, defaultValue: "razorpay" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "artistPenalty", { type: "INTEGER", allowNull: true, defaultValue: 0 }); } catch (e) {}
    console.log("Missing Razorpay & Bookings columns synced successfully.");

    // Inject missing ArtistProfiles columns
    try { await qi.addColumn("ArtistProfiles", "parlourName", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("ArtistProfiles", "parlourAddress", { type: "TEXT" }); } catch (e) {}
    try { await qi.addColumn("ArtistProfiles", "rating", { type: "DOUBLE PRECISION", allowNull: false, defaultValue: 4.5 }); } catch (e) {}
    try { await qi.addColumn("ArtistProfiles", "reviewCount", { type: "INTEGER", allowNull: false, defaultValue: 0 }); } catch (e) {}
    console.log("Missing ArtistProfiles columns synced successfully.");
 
    // Inject missing ArtistPortfolios columns
    try {
      const { DataTypes } = await import("sequelize");
      await qi.addColumn("ArtistPortfolios", "images", { type: DataTypes.JSON, allowNull: true });
    } catch (e) {}
    console.log("Missing ArtistPortfolios columns synced successfully.");

    // Inject email verification columns into Artists
    try { await qi.addColumn("Artists", "isVerified", { type: "BOOLEAN", defaultValue: true }); } catch (e) {}
    try { await qi.addColumn("Artists", "verificationCode", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Artists", "verificationCodeExpires", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    try { await qi.addColumn("Artists", "isEmailVerified", { type: "BOOLEAN", defaultValue: false }); } catch (e) {}
    try { await qi.addColumn("Artists", "emailVerificationToken", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Artists", "emailVerificationExpires", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    // Inject Customers columns
    try { await qi.addColumn("Customers", "profileImage", { type: "VARCHAR(255)" }); } catch (e) {}

    // Inject deletedAt soft-delete columns across all tables
    const tablesForParanoid = [
      "Bookings", "Customers", "Artists", "ArtistProfiles",
      "ArtistServices", "ArtistPortfolios", "ArtistPayments",
      "ArtistCertificates", "ArtistSpecializations", "ArtistBlocks",
      "Reviews", "Messages", "Wishlists", "CallLogs", "ActivityLogs", "Admins"
    ];
    for (const table of tablesForParanoid) {
      try { await qi.addColumn(table, "deletedAt", { type: "TIMESTAMP WITH TIME ZONE", allowNull: true }); } catch (e) {}
    }
    console.log("Soft-delete (deletedAt) columns verified on all database tables.");

    // Auto-create EmailOtps table if it doesn't exist
    await EmailOtp.sync();
    console.log("EmailOtps table synced successfully.");

  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

bootstrapDatabase();

// Periodically check and auto-expire pending (15 min limit) and payment-expired bookings
setInterval(() => {
  checkAndExpireBookings().catch((err) => {
    console.error("[AutoExpireWorker] Error checking expired bookings:", err.message);
  });
}, 30 * 1000);

app.get("/", (req, res) => {
  res.send("Hello Wordl!");
});

const PORT = process.env.PORT || 5000;

initSocketServer(server);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use by an active backend instance. Server is active.`);
  } else {
    console.error("Server error:", err);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (0.0.0.0)`);
});
