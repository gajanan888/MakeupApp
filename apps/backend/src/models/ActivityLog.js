import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ActivityLog = sequelize.define("ActivityLog", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userType: {
    type: DataTypes.ENUM("customer", "artist", "admin", "system"),
    allowNull: false,
    defaultValue: "system",
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bookingId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});

export default ActivityLog;
