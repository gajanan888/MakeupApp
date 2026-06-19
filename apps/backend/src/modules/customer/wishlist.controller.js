// Wishlist controller for Customer
import Wishlist from "../../models/Wishlist.js";
import Artist from "../../models/Artist.js";

// Add an artist to the customer's wishlist
export const addToWishlist = async (req, res) => {
  try {
    const customer = req.customer;
    const { artistId } = req.body;
    if (!artistId) {
      return res.status(400).json({ message: "artistId is required" });
    }
    const artist = await Artist.findByPk(artistId);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    // Sequelize will handle through table insertion
    await customer.addWishlistedArtists(artist);
    return res.json({ success: true, message: "Artist added to wishlist" });
  } catch (error) {
    console.error("[wishlist] add error", error);
    return res.status(500).json({ message: error.message || "Failed to add to wishlist" });
  }
};

// Remove an artist from the customer's wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const customer = req.customer;
    const { artistId } = req.body;
    if (!artistId) {
      return res.status(400).json({ message: "artistId is required" });
    }
    const artist = await Artist.findByPk(artistId);
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }
    await customer.removeWishlistedArtists(artist);
    return res.json({ success: true, message: "Artist removed from wishlist" });
  } catch (error) {
    console.error("[wishlist] remove error", error);
    return res.status(500).json({ message: error.message || "Failed to remove from wishlist" });
  }
};

// Get the list of wishlisted artists for the customer
export const getWishlist = async (req, res) => {
  try {
    const customer = req.customer;
    const artists = await customer.getWishlistedArtists();
    return res.json({ success: true, data: artists });
  } catch (error) {
    console.error("[wishlist] get error", error);
    return res.status(500).json({ message: error.message || "Failed to fetch wishlist" });
  }
};
