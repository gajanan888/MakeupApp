import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistCertificate = sequelize.define("ArtistCertificate", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING,
  },
  fileUrl: {
    type: DataTypes.STRING,
  },
  fileSize: {
    type: DataTypes.INTEGER,
  },
  fileType: {
    type: DataTypes.STRING,
  },
  certificateNumber: {
    type: DataTypes.STRING,
  },
  instituteName: {
    type: DataTypes.STRING,
  },
});

Artist.hasMany(ArtistCertificate, {
  foreignKey: "artistId",
  as: "certificates",
});
ArtistCertificate.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",
});

export default ArtistCertificate;
