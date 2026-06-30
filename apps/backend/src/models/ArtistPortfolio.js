import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistPortfolio = sequelize.define("ArtistPortfolio", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  beforeImageUrl: {
    type: DataTypes.STRING,
  },
  afterImageUrl: {
    type: DataTypes.STRING,
  },
  tag: {
    type: DataTypes.STRING,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
});

Artist.hasMany(ArtistPortfolio, {
  foreignKey: "artistId",
  as: "portfolio",
});
ArtistPortfolio.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",
});

export default ArtistPortfolio;
