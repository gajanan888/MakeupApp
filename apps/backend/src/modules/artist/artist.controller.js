import {
  getArtistProfile,
  updateArtistProfile,
  getArtistDashboardStats,
  getArtistSchedule,
  createArtistBlock,
  changeArtistPassword,
} from "./artist.service.js";

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

export const getArtistDashboardStatsController = async (req, res) => {
  try {
    const stats = await getArtistDashboardStats(req.artist.id);
    res.json({
      success: true,
      message: "Dashboard stats fetched",
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stats",
      data: null,
    });
  }
};

export const getArtistScheduleController = async (req, res) => {
  try {
    const schedule = await getArtistSchedule(req.artist.id);
    res.json({
      success: true,
      message: "Schedule fetched",
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch schedule",
      data: null,
    });
  }
};

export const createArtistBlockController = async (req, res) => {
  try {
    const block = await createArtistBlock(req.artist.id, req.body);
    res.status(201).json({
      success: true,
      message: "Unavailable block created",
      data: block,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create block",
      data: null,
    });
  }
};

export const changeArtistPasswordController = async (req, res) => {
  try {
    const artistId = req.artist.id;
    const { currentPassword, newPassword } = req.body;

    await changeArtistPassword(artistId, { currentPassword, newPassword });

    res.json({
      success: true,
      message: "Password updated successfully",
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update password",
      data: null,
    });
  }
};
