import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import Artist from "../models/Artist.js";

/**
 * Socket.IO authentication middleware.
 * Expects the client to provide `token` and `role` in `socket.handshake.auth`.
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const { token, role } = socket.handshake.auth;

    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Socket] Auth Failed: No token provided");
      }
      return next(new Error("Authentication error: No token provided"));
    }

    if (!role || (role !== "client" && role !== "artist")) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[Socket] Auth Failed: Invalid role '${role}'`);
      }
      return next(new Error("Authentication error: Invalid role"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Socket] Auth Failed: Invalid or expired token");
      }
      return next(new Error("Authentication error: Invalid token"));
    }

    // Verify the user exists in the database
    let user;
    if (role === "client") {
      user = await Customer.findByPk(decoded.id);
    } else if (role === "artist") {
      user = await Artist.findByPk(decoded.id);
    }

    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[Socket] Auth Failed: User ID ${decoded.id} not found in DB`);
      }
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user payload to the socket
    socket.user = {
      id: decoded.id,
      role: role,
    };

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Socket] Auth Success: ${role}_${decoded.id}`);
    }

    next();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Socket] Unexpected Auth Error:", err.message);
    }
    next(new Error("Authentication error: Internal server error"));
  }
};
