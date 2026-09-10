import Package from "../../models/Package.js";
import Brand from "../../models/Brand.js";
import Product from "../../models/Product.js";
import Service from "../../models/Service.js";
import PackageProduct from "../../models/PackageProduct.js";
import PackageService from "../../models/PackageService.js";
import PackageAddon from "../../models/PackageAddon.js";

// Brands
export const getAllBrands = async () => {
  return await Brand.findAll({ order: [["name", "ASC"]] });
};

export const createBrand = async (name) => {
  return await Brand.create({ name });
};

// Products
export const getAllProducts = async (brandId) => {
  const whereClause = brandId ? { brandId } : {};
  return await Product.findAll({
    where: whereClause,
    include: [{ model: Brand, as: "brand" }],
    order: [["category", "ASC"], ["productName", "ASC"]],
  });
};

export const createProduct = async (data) => {
  return await Product.create(data);
};

// Services
export const getAllServices = async () => {
  return await Service.findAll({ order: [["name", "ASC"]] });
};

export const createService = async (name) => {
  return await Service.create({ name });
};

// Packages
export const createPackage = async (artistId, packageData) => {
  const { name, occasion, packageLevel, makeupLook, price, duration, description, productIds, serviceIds, addons } = packageData;
  
  const newPackage = await Package.create({
    artistId,
    name,
    occasion,
    packageLevel,
    makeupLook,
    price,
    duration,
    description,
    isActive: true,
  });

  if (productIds && productIds.length > 0) {
    const packageProducts = productIds.map(productId => ({ packageId: newPackage.id, productId }));
    await PackageProduct.bulkCreate(packageProducts);
  }

  if (serviceIds && serviceIds.length > 0) {
    const packageServices = serviceIds.map(serviceId => ({ packageId: newPackage.id, serviceId }));
    await PackageService.bulkCreate(packageServices);
  }

  if (addons && addons.length > 0) {
    const packageAddons = addons.map(addon => ({
      packageId: newPackage.id,
      serviceId: addon.serviceId,
      additionalPrice: addon.additionalPrice
    }));
    await PackageAddon.bulkCreate(packageAddons);
  }

  return await getPackageById(newPackage.id);
};

export const updatePackage = async (packageId, artistId, packageData) => {
  const pkg = await Package.findOne({ where: { id: packageId, artistId } });
  if (!pkg) throw new Error("Package not found");

  const { name, occasion, packageLevel, makeupLook, price, duration, description, productIds, serviceIds, addons, isActive } = packageData;

  await pkg.update({
    name, occasion, packageLevel, makeupLook, price, duration, description, isActive
  });

  if (productIds !== undefined) {
    await PackageProduct.destroy({ where: { packageId }, force: true });
    if (productIds.length > 0) {
      const packageProducts = productIds.map(productId => ({ packageId, productId }));
      await PackageProduct.bulkCreate(packageProducts);
    }
  }

  if (serviceIds !== undefined) {
    await PackageService.destroy({ where: { packageId }, force: true });
    if (serviceIds.length > 0) {
      const packageServices = serviceIds.map(serviceId => ({ packageId, serviceId }));
      await PackageService.bulkCreate(packageServices);
    }
  }

  if (addons !== undefined) {
    await PackageAddon.destroy({ where: { packageId }, force: true });
    if (addons.length > 0) {
      const packageAddons = addons.map(addon => ({
        packageId,
        serviceId: addon.serviceId,
        additionalPrice: addon.additionalPrice
      }));
      await PackageAddon.bulkCreate(packageAddons);
    }
  }

  return await getPackageById(packageId);
};

export const deletePackage = async (packageId, artistId) => {
  const pkg = await Package.findOne({ where: { id: packageId, artistId } });
  if (!pkg) throw new Error("Package not found");
  
  await pkg.destroy();
  return { message: "Package deleted successfully" };
};

export const getArtistPackages = async (artistId) => {
  return await Package.findAll({
    where: { artistId },
    include: [
      {
        model: Product,
        as: "products",
        include: [{ model: Brand, as: "brand" }]
      },
      {
        model: Service,
        as: "services"
      },
      {
        model: PackageAddon,
        as: "addons",
        include: [{ model: Service, as: "service" }]
      }
    ],
    order: [["price", "ASC"]]
  });
};

export const getPackageById = async (packageId) => {
  return await Package.findByPk(packageId, {
    include: [
      {
        model: Product,
        as: "products",
        include: [{ model: Brand, as: "brand" }]
      },
      {
        model: Service,
        as: "services"
      },
      {
        model: PackageAddon,
        as: "addons",
        include: [{ model: Service, as: "service" }]
      }
    ]
  });
};
