import Booking from "../models/Booking.js";

/**
 * Validates if the caller is authorized to initiate a call for this booking.
 */
const validateBookingCall = async (bookingId, callerId, callerRole) => {
  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    return { valid: false, reason: "Booking not found" };
  }

  // Ensure the caller is part of the booking
  if (callerRole === "client" && booking.customerId !== callerId) {
    return { valid: false, reason: "Unauthorized: You are not the client for this booking" };
  }
  if (callerRole === "artist" && booking.artistId !== callerId) {
    return { valid: false, reason: "Unauthorized: You are not the artist for this booking" };
  }

  // Business logic: Call is only allowed if status is confirmed and advance is paid
  if (booking.status !== "confirmed") {
    return { valid: false, reason: `Booking is not confirmed (current status: ${booking.status})` };
  }
  if (booking.advancePaid !== true) {
    return { valid: false, reason: "Advance payment is not completed" };
  }

  return { valid: true, booking };
};

/**
 * Registers all call-related socket events.
 */
export const registerCallHandlers = (io, socket) => {
  const { id: callerId, role: callerRole } = socket.user;

  socket.on("initiate-call", async (payload) => {
    const { bookingId, targetId, targetRole } = payload;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Call] Initiated by ${callerRole}_${callerId} to ${targetRole}_${targetId} for booking ${bookingId}`);
    }

    try {
      const { valid, reason, booking } = await validateBookingCall(bookingId, callerId, callerRole);

      if (!valid) {
        if (process.env.NODE_ENV !== "production") {
          console.error(`[Call] Validation Failed: ${reason}`);
        }
        socket.emit("call-failed", { reason });
        return;
      }

      // Ensure the target ID matches the other party in the booking
      const expectedTargetId = callerRole === "client" ? booking.artistId : booking.customerId;
      if (expectedTargetId !== targetId) {
        socket.emit("call-failed", { reason: "Target user is not part of this booking" });
        return;
      }

      const targetRoom = `${targetRole}_${targetId}`;
      
      // Forward the incoming call event
      io.to(targetRoom).emit("incoming-call", {
        bookingId,
        callerId,
        callerRole,
        callerName: socket.handshake.auth.callerName || "Unknown", // Can be provided by client
      });

    } catch (err) {
      console.error("[Call] Internal Error during validation:", err);
      socket.emit("call-failed", { reason: "Internal server error" });
    }
  });

  // ── Call Lifecycle Events ──────────────────────────────────────────────────

  socket.on("accept-call", ({ targetId, targetRole, bookingId }) => {
    if (process.env.NODE_ENV !== "production") console.log(`[Call] Accepted by ${callerRole}_${callerId}`);
    io.to(`${targetRole}_${targetId}`).emit("call-accepted", { bookingId });
  });

  socket.on("reject-call", ({ targetId, targetRole, bookingId }) => {
    if (process.env.NODE_ENV !== "production") console.log(`[Call] Rejected by ${callerRole}_${callerId}`);
    io.to(`${targetRole}_${targetId}`).emit("call-rejected", { bookingId, reason: "declined" });
  });

  socket.on("user-busy", ({ targetId, targetRole, bookingId }) => {
    if (process.env.NODE_ENV !== "production") console.log(`[Call] Busy - ${callerRole}_${callerId}`);
    io.to(`${targetRole}_${targetId}`).emit("call-rejected", { bookingId, reason: "busy" });
  });

  socket.on("end-call", ({ targetId, targetRole, bookingId }) => {
    if (process.env.NODE_ENV !== "production") console.log(`[Call] Ended by ${callerRole}_${callerId}`);
    io.to(`${targetRole}_${targetId}`).emit("call-ended", { bookingId });
  });

  // ── WebRTC Signaling Events ────────────────────────────────────────────────

  socket.on("webrtc-offer", ({ targetId, targetRole, sdp }) => {
    if (process.env.NODE_ENV !== "production") console.log(`[WebRTC] Offer from ${callerRole}_${callerId}`);
    io.to(`${targetRole}_${targetId}`).emit("webrtc-offer", { sdp });
  });

  socket.on("webrtc-answer", ({ targetId, targetRole, sdp }) => {
    if (process.env.NODE_ENV !== "production") console.log(`[WebRTC] Answer from ${callerRole}_${callerId}`);
    io.to(`${targetRole}_${targetId}`).emit("webrtc-answer", { sdp });
  });

  socket.on("webrtc-ice-candidate", ({ targetId, targetRole, candidate }) => {
    // ICE candidates can be quite noisy, so logging is disabled or kept minimal
    io.to(`${targetRole}_${targetId}`).emit("webrtc-ice-candidate", { candidate });
  });

};
