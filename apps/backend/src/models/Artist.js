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

  pricing: {
    type: DataTypes.FLOAT,
  },

  experience: {
    type: DataTypes.INTEGER,
  },

  profileImage: {
    type: DataTypes.STRING,
  },

  gender: {
    type: DataTypes.STRING,
  },

  bio: {
    type: DataTypes.TEXT,
  },

  location: {
    type: DataTypes.TEXT,
  },

  specializations: {
    type: DataTypes.ARRAY(DataTypes.STRING),
  },

  certificates: {
    type: DataTypes.JSONB,
  },
});

export default Artist;
