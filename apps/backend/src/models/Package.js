import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const Package = sequelize.define("Package", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  packageLevel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  makeupLook: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING, // e.g. "2.5 Hours", "150 mins"
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasMany(Package, { foreignKey: "artistId", as: "packages" });
Package.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default Package;
