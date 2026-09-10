import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Service = sequelize.define("Service", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});

export default Service;
