import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";

const ArtistBlock = sequelize.define("ArtistBlock", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasMany(ArtistBlock, { foreignKey: "artistId", as: "blocks" });
ArtistBlock.belongsTo(Artist, { foreignKey: "artistId", as: "artist" });

export default ArtistBlock;
