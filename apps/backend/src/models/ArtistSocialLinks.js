import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistSocialLinks = sequelize.define("ArtistSocialLinks", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  instagram: {
    type: DataTypes.STRING,
  },
  facebook: {
    type: DataTypes.STRING,
  },
  youtube: {
    type: DataTypes.STRING,
  },
  website: {
    type: DataTypes.STRING,
  },
  whatsapp: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasOne(ArtistSocialLinks, { foreignKey: "artistId", as: "socialLinks" });
ArtistSocialLinks.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default ArtistSocialLinks;
