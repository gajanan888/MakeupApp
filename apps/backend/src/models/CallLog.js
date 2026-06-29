import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Booking from "./Booking.js";
import Customer from "./Customer.js";
import Artist from "./Artist.js";

const CallLog = sequelize.define("CallLog", {
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  callerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  callerRole: {
    type: DataTypes.STRING, // 'client' or 'artist'
    allowNull: false,
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  targetRole: {
    type: DataTypes.STRING, // 'client' or 'artist'
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "initiated", // initiated, connected, missed, failed, ended
  },
  durationSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// Associations
CallLog.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });
Booking.hasMany(CallLog, { foreignKey: "bookingId", as: "callLogs" });

export default CallLog;
