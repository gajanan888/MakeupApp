import jwt from "jsonwebtoken";
import Artist from "../models/Artist.js";

export const protectArtist = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const artist = await Artist.findByPk(decoded.id);
    if (!artist) {
      return res.status(401).json({
        success: false,
        message: "Artist not found",
        data: null,
      });
    }

    req.artist = artist;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
      data: null,
    });
  }
};
