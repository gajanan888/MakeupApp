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
    type: DataTypes.ENUM(
      "pending",
      "accepted",
      "rejected",
      "completed",
      "cancelled",
    ),
    allowNull: false,
    defaultValue: "pending",
  },
});

Customer.hasMany(Booking, { foreignKey: "customerId", as: "bookings" });
Artist.hasMany(Booking, { foreignKey: "artistId", as: "bookings" });
Booking.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Booking.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default Booking;
