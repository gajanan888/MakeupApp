import { loginArtist, registerArtist } from "./artistAuth.service.js";
import { logActivity } from "../../utils/activityLogger.js";

export const registerArtistController = async (req, res) => {
  try {
    const data = await registerArtist(req.body);

    // Log activity
    if (data?.artist) {
      await logActivity({
        userId: data.artist.id,
        userType: "artist",
        userName: data.artist.name,
        action: "ARTIST_REGISTER",
        details: "Registered a new artist account.",
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: "Artist registered",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Artist registration failed",
      data: null,
    });
  }
};

export const loginArtistController = async (req, res) => {
  try {
    const data = await loginArtist(req.body);

    // Log activity
    if (data?.artist) {
      await logActivity({
        userId: data.artist.id,
        userType: "artist",
        userName: data.artist.name,
        action: "ARTIST_LOGIN",
        details: "Logged into the application.",
        req,
      });
    }

    res.json({
      success: true,
      message: "Artist login successful",
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Artist login failed",
      data: null,
    });
  }
};
