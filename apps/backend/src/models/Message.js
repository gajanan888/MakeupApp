import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Artist from "./Artist.js";
import Customer from "./Customer.js";

const Message = sequelize.define("Message", {
  artistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sender: {
    type: DataTypes.ENUM("artist", "client"),
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Artist.hasMany(Message, {
  foreignKey: "artistId",
  as: "messages",
});
Message.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",
});

Customer.hasMany(Message, {
  foreignKey: "customerId",
  as: "messages",
});
Message.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

export default Message;
