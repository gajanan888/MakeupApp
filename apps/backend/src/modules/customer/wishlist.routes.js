// Wishlist routes for Customer
import express from "express";
import { addToWishlist, removeFromWishlist, getWishlist } from "./wishlist.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";

const router = express.Router();
router.use(protectCustomer); // protect all wishlist endpoints
router.post("/add", addToWishlist);
router.post("/remove", removeFromWishlist);
router.get("/", getWishlist);

export default router;
