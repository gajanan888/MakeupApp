import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const EmailOtp = sequelize.define("EmailOtp", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export default EmailOtp;
