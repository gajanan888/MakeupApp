import { loginArtist, registerArtist } from "./artistAuth.service.js";

export const registerArtistController = async (req, res) => {
  try {
    const data = await registerArtist(req.body);
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
