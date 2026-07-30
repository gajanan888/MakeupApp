import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Wishlist from "./Wishlist.js";
import Artist from "./Artist.js";

const Customer = sequelize.define("Customer", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
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
  role: {
    type: DataTypes.ENUM("user", "artist", "admin"),
    defaultValue: "user",
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  paranoid: true,
});
Customer.belongsToMany(Artist, { through: Wishlist, as: 'wishlistedArtists', foreignKey: 'customerId' });
Artist.belongsToMany(Customer, { through: Wishlist, as: 'wishlistedBy', foreignKey: 'artistId' });
export default Customer;


