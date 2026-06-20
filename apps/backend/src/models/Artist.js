import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Artist = sequelize.define("Artist", {
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
  },

  password: {
    type: DataTypes.STRING,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // keep Artist model minimal; profile and related fields moved to normalized tables
});

export default Artist;
