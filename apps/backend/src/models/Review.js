import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Customer from "./Customer.js";
import Artist from "./Artist.js";
import Booking from "./Booking.js";

const Review = sequelize.define("Review", {
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Associations
Customer.hasMany(Review, { foreignKey: "customerId", as: "reviews" });
Artist.hasMany(Review, { foreignKey: "artistId", as: "reviews" });
Booking.hasOne(Review, { foreignKey: "bookingId", as: "review" });

Review.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Review.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });
Review.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });

export default Review;
