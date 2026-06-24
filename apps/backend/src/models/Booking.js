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
});

Customer.hasMany(Booking, { foreignKey: "customerId", as: "bookings" });
Artist.hasMany(Booking, { foreignKey: "artistId", as: "bookings" });
Booking.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Booking.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default Booking;
