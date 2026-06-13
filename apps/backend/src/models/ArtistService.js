import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistService = sequelize.define("ArtistService", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  specialization: {
    type: DataTypes.STRING,
  },
  duration: {
    type: DataTypes.STRING,
  },
  timeRange: {
    type: DataTypes.STRING,
  },
  priceRange: {
    type: DataTypes.STRING,
  },
});

Artist.hasMany(ArtistService, { foreignKey: "artistId", as: "services" });
ArtistService.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default ArtistService;
