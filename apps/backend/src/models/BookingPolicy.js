import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const BookingPolicy = sequelize.define("BookingPolicy", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  advanceNotice: {
    type: DataTypes.STRING,
  },
  trialType: {
    type: DataTypes.STRING,
  },
  trialPrice: {
    type: DataTypes.FLOAT,
  },
  requiresAdvance: {
    type: DataTypes.BOOLEAN,
  },
  advanceType: {
    type: DataTypes.STRING,
  },
  advanceValue: {
    type: DataTypes.FLOAT,
  },
  cancellationPolicy: {
    type: DataTypes.STRING,
  },
  cancellationPolicyCustom: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasOne(BookingPolicy, { foreignKey: "artistId", as: "bookingPolicy" });
BookingPolicy.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default BookingPolicy;
