import express from "express";
import {
  getBrands,
  createBrand,
  getProducts,
  createProduct,
  getServices,
  createService,
  createPackage,
  updatePackage,
  deletePackage,
  getArtistPackages,
  getPackageById
} from "./package.controller.js";
import { protectArtist } from "../../middleware/artistAuth.js";

const router = express.Router();

// Public Metadata Routes
router.get("/brands", getBrands);
router.post("/brands", createBrand);
router.get("/products", getProducts);
router.post("/products", createProduct);
router.get("/services", getServices);
router.post("/services", createService);

// Protected Artist Routes
router.get("/my-packages", protectArtist, getArtistPackages); // uses req.artist.id
router.post("/", protectArtist, createPackage);
router.put("/:id", protectArtist, updatePackage);
router.delete("/:id", protectArtist, deletePackage);

// Public Package Routes (parameterized routes at the bottom)
router.get("/artist/:artistId", getArtistPackages);
router.get("/:id", getPackageById);

export default router;
