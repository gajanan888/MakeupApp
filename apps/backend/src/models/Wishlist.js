import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Junction table for many-to-many relationship between Customer and Artist
const Wishlist = sequelize.define("Wishlist", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Customers",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Artists",
      key: "id",
    },
    onDelete: "CASCADE",
  },
}, {
  timestamps: true,
  tableName: "Wishlists",
});

export default Wishlist;
