import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import sequelize from "./src/config/db.js";
import routes from "./src/routes/index.js";
import initSocketServer from "./src/socket/index.js";
import EmailOtp from "./src/models/EmailOtp.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
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
    // Removed alter: true to avoid dialect-specific ALTER TABLE syntax errors.
    // Schema changes should rely on migrations.
    await sequelize.sync();

    // TEMPORARY FIX: Inject missing Razorpay columns into Supabase because migrations got out of sync
    const qi = sequelize.getQueryInterface();
    try { await qi.addColumn("Bookings", "razorpayOrderId", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "razorpayPaymentId", { type: "VARCHAR(255)", unique: true }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentStatus", { type: "VARCHAR(255)", allowNull: false, defaultValue: "unpaid" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentMethod", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paidAt", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentFailureReason", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "paymentGateway", { type: "VARCHAR(255)", allowNull: false, defaultValue: "razorpay" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "artistPenalty", { type: "INTEGER", allowNull: true, defaultValue: 0 }); } catch (e) {}
    console.log("Missing Razorpay columns synced successfully.");

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
    try { await qi.addColumn("Artists", "verificationCode", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Artists", "verificationCodeExpires", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    try { await qi.addColumn("Artists", "isEmailVerified", { type: "BOOLEAN", defaultValue: false }); } catch (e) {}
    try { await qi.addColumn("Artists", "emailVerificationToken", { type: "VARCHAR(255)" }); } catch (e) {}
    try { await qi.addColumn("Artists", "emailVerificationExpires", { type: "TIMESTAMP WITH TIME ZONE" }); } catch (e) {}
    console.log("Email verification columns for Artists synced successfully.");

    // Auto-create EmailOtps table if it doesn't exist
    await EmailOtp.sync();
    console.log("EmailOtps table synced successfully.");

  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

bootstrapDatabase();

app.get("/", (req, res) => {
  res.send("Hello Wordl!");
});

const PORT = process.env.PORT || 5000;

initSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
