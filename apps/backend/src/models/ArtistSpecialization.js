import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistSpecialization = sequelize.define("ArtistSpecialization", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasMany(ArtistSpecialization, {
  foreignKey: "artistId",
  as: "specializations",
});
ArtistSpecialization.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",
});

export default ArtistSpecialization;
