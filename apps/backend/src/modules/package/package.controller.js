import * as PackageService from "./package.service.js";

// Brands
export const getBrands = async (req, res) => {
  try {
    const brands = await PackageService.getAllBrands();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBrand = async (req, res) => {
  try {
    const brand = await PackageService.createBrand(req.body.name);
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Products
export const getProducts = async (req, res) => {
  try {
    const { brandId } = req.query;
    const products = await PackageService.getAllProducts(brandId);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await PackageService.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Services
export const getServices = async (req, res) => {
  try {
    const services = await PackageService.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await PackageService.createService(req.body.name);
    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Packages
export const createPackage = async (req, res) => {
  try {
    const artistId = req.artist.id; // From protectArtist middleware
    const pkg = await PackageService.createPackage(artistId, req.body);
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const artistId = req.artist.id;
    const { id } = req.params;
    const pkg = await PackageService.updatePackage(id, artistId, req.body);
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const artistId = req.artist.id;
    const { id } = req.params;
    const result = await PackageService.deletePackage(id, artistId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getArtistPackages = async (req, res) => {
  try {
    const artistId = req.params.artistId || (req.artist && req.artist.id);
    if (!artistId) {
      return res.status(400).json({ error: "Artist ID is required" });
    }
    const packages = await PackageService.getArtistPackages(artistId);
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await PackageService.getPackageById(id);
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
