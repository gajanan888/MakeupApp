import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistProfile = sequelize.define("ArtistProfile", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
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
  experience: {
    type: DataTypes.STRING,
  },
  parlourName: {
    type: DataTypes.STRING,
  },
  parlourAddress: {
    type: DataTypes.TEXT,
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 4.5,
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

Artist.hasOne(ArtistProfile, { foreignKey: "artistId", as: "profile" });
ArtistProfile.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default ArtistProfile;
