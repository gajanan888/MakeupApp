import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Package from "./Package.js";
import Service from "./Service.js";

const PackageService = sequelize.define("PackageService", {
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
});

// Relationships
Package.belongsToMany(Service, { through: PackageService, foreignKey: "packageId", as: "services" });
Service.belongsToMany(Package, { through: PackageService, foreignKey: "serviceId", as: "packages" });

export default PackageService;
