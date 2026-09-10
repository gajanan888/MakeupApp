import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Brand = sequelize.define("Brand", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});

export default Brand;
