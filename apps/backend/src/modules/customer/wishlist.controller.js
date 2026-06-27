// Wishlist controller for Customer
import Wishlist from "../../models/Wishlist.js";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistSpecialization from "../../models/ArtistSpecialization.js";
import ArtistService from "../../models/ArtistService.js";

// Add an artist to the customer's wishlist
export const addToWishlist = async (req, res) => {
  try {
    const customer = req.customer;
    const { artistId } = req.body;
    if (!artistId) {
      return res.status(400).json({ message: "artistId is required" });
    }
    const artist = await Artist.findByPk(artistId);
    if (!artist || !artist.isVerified) {
      return res.status(404).json({ message: "Artist not found or not verified" });
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
    const artists = await customer.getWishlistedArtists({
      where: { isVerified: true },
      include: [
        {
          model: ArtistProfile,
          as: "profile",
          attributes: ["profileImage", "gender", "bio", "location", "experience"],
        },
        {
          model: ArtistSpecialization,
          as: "specializations",
          attributes: ["id", "name"],
        },
        {
          model: ArtistService,
          as: "services",
          attributes: ["id", "specialization", "duration", "timeRange", "priceRange"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ success: true, data: artists });
  } catch (error) {
    console.error("[wishlist] get error", error);
    return res.status(500).json({ message: error.message || "Failed to fetch wishlist" });
  }
};

