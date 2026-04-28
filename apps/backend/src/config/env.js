import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Customer = sequelize.define("Customer", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING,
    unique: true,
  },

  phone: {
    type: DataTypes.STRING,
    unique: true,
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Customer;
