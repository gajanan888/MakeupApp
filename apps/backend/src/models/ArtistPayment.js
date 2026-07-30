import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistPayment = sequelize.define("ArtistPayment", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  accountHolder: {
    type: DataTypes.STRING,
  },
  bankName: {
    type: DataTypes.STRING,
  },
  accountNumber: {
    type: DataTypes.STRING,
  },
  ifscCode: {
    type: DataTypes.STRING,
  },
  upiId: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasOne(ArtistPayment, { foreignKey: "artistId", as: "payment" });
ArtistPayment.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default ArtistPayment;
