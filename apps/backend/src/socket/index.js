import { Server } from "socket.io";
import { socketAuthMiddleware } from "./auth.js";

let io;

export default function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const { id, role } = socket.user;
    const personalRoom = `${role}_${id}`;
    
    socket.join(personalRoom);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Socket] Connected: ${socket.id} (Room: ${personalRoom})`);
    }

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Socket] Disconnected: ${socket.id} (Room: ${personalRoom})`);
      }
    });
  });

  return io;
}

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
