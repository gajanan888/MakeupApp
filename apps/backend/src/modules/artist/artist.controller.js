import { getArtistProfile, updateArtistProfile } from "./artist.service.js";

export const getArtistProfileController = async (req, res) => {
  try {
    const artist = await getArtistProfile(req.artist.id);
    res.json({
      success: true,
      message: "Profile fetched",
      data: artist,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || "Profile not found",
      data: null,
    });
  }
};

export const updateArtistProfileController = async (req, res) => {
  try {
    const artist = await updateArtistProfile(req.artist.id, req.body);
    res.json({
      success: true,
      message: "Profile updated",
      data: artist,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Profile update failed",
      data: null,
    });
  }
};
