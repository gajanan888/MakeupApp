import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Package from "./Package.js";
import Product from "./Product.js";

const PackageProduct = sequelize.define("PackageProduct", {
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
});

// Relationships
Package.belongsToMany(Product, { through: PackageProduct, foreignKey: "packageId", as: "products" });
Product.belongsToMany(Package, { through: PackageProduct, foreignKey: "productId", as: "packages" });

export default PackageProduct;
