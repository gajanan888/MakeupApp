import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Customer from "./Customer.js";
import Artist from "./Artist.js";

const Booking = sequelize.define("Booking", {
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  addOns: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  totalPaid: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  rejectionReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  advanceAmount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  hasInsurance: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  insuranceFee: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  advancePaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  paymentDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelledBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cancellationReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refundAmount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  refundStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "none", // "none", "pending", "refunded"
  },
  artistPenalty: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  razorpayOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  razorpayPaymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "unpaid",
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  paymentFailureReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentGateway: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "razorpay",
  },
  backupArtistId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  backupStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
  },
  startOtp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Customer.hasMany(Booking, { foreignKey: "customerId", as: "bookings" });
Artist.hasMany(Booking, { foreignKey: "artistId", as: "bookings" });
Artist.hasMany(Booking, { foreignKey: "backupArtistId", as: "backupBookings" });
Booking.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Booking.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });
Booking.belongsTo(Artist, { foreignKey: "backupArtistId", as: "backupArtist" });

export default Booking;
