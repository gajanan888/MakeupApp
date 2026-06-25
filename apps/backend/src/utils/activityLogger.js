import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async ({
  userId = null,
  userType = "system",
  userName = "System",
  action,
  bookingId = null,
  details = "",
  req = null,
}) => {
  try {
    let ipAddress = null;
    if (req) {
      ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    }
    
    await ActivityLog.create({
      userId,
      userType,
      userName,
      action,
      bookingId,
      details,
      ipAddress,
    });
    console.log(`[ActivityLog] ${userType.toUpperCase()} (${userName}): ${action} - ${details}`);
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
};
