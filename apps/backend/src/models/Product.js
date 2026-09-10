import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Brand from "./Brand.js";

const Product = sequelize.define("Product", {
  brandId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
  paranoid: true,
});

Brand.hasMany(Product, { foreignKey: "brandId", as: "products" });
Product.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });

export default Product;
