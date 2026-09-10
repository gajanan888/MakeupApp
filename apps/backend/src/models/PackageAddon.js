import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Package from "./Package.js";
import Service from "./Service.js";

const PackageAddon = sequelize.define("PackageAddon", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Package,
      key: 'id',
    }
  },
  serviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Service,
      key: 'id',
    }
  },
  additionalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  }
}, {
  timestamps: true,
});

Package.hasMany(PackageAddon, { foreignKey: 'packageId', as: 'addons' });
PackageAddon.belongsTo(Package, { foreignKey: 'packageId' });
Service.hasMany(PackageAddon, { foreignKey: 'serviceId' });
PackageAddon.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

export default PackageAddon;
