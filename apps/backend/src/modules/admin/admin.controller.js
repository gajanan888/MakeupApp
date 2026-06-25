import {
  changeAdminPassword,
  getAdminProfile,
  getDashboardAnalytics,
  listArtists,
  listBookings,
  listCustomers,
  updateBookingStatus,
  verifyArtist,
  getTechHealth,
  getActivityLogs,
} from "./admin.service.js";
import {
  getPagination,
  validateBookingStatus,
  validateIdParam,
  validatePasswordChange,
} from "../../validators/admin.validator.js";
import { logActivity } from "../../utils/activityLogger.js";

export const getAdminProfileController = async (req, res) => {
  try {
    const admin = await getAdminProfile(req.admin.id);
    res.json({
      success: true,
      message: "Admin profile fetched",
      data: admin,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || "Admin not found",
      data: null,
    });
  }
};

export const changeAdminPasswordController = async (req, res) => {
  try {
    const errors = validatePasswordChange(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: { errors },
      });
    }

    await changeAdminPassword(req.admin.id, req.body);
    res.json({
      success: true,
      message: "Password updated",
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

export const listCustomersController = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const result = await listCustomers({
      q: req.query.q,
      offset,
      limit,
    });

    res.json({
      success: true,
      message: "Customers fetched",
      data: {
        items: result.rows,
        total: result.count,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customers",
      data: null,
    });
  }
};

export const listArtistsController = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const result = await listArtists({
      q: req.query.q,
      offset,
      limit,
    });

    res.json({
      success: true,
      message: "Artists fetched",
      data: {
        items: result.rows,
        total: result.count,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch artists",
      data: null,
    });
  }
};

export const listBookingsController = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(
      req.query.page,
      req.query.limit,
    );
    const result = await listBookings({
      status: req.query.status,
      customerId: req.query.customerId
        ? Number(req.query.customerId)
        : undefined,
      artistId: req.query.artistId ? Number(req.query.artistId) : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      offset,
      limit,
    });

    res.json({
      success: true,
      message: "Bookings fetched",
      data: {
        items: result.rows,
        total: result.count,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch bookings",
      data: null,
    });
  }
};

export const updateBookingStatusController = async (req, res) => {
  try {
    const { isValid, value } = validateIdParam(req.params.id);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    if (req.body.status !== undefined && !validateBookingStatus(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
        data: null,
      });
    }

    const { status, advancePaid, refundStatus, refundAmount } = req.body;

    const booking = await updateBookingStatus({
      bookingId: value,
      status,
      advancePaid,
      refundStatus,
      refundAmount,
    });

    const changes = [];
    if (status !== undefined) changes.push(`status to '${status}'`);
    if (advancePaid !== undefined) changes.push(`advancePaid to '${advancePaid}'`);
    if (refundStatus !== undefined) changes.push(`refundStatus to '${refundStatus}'`);
    if (refundAmount !== undefined) changes.push(`refundAmount to '${refundAmount}'`);

    await logActivity({
      userId: req.admin.id,
      userType: "admin",
      userName: req.admin.name,
      action: "ADMIN_STATUS_UPDATE",
      bookingId: booking.id,
      details: `Admin updated booking #${booking.id}: ${changes.join(", ")}.`,
      req,
    });

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update booking",
      data: null,
    });
  }
};

export const getDashboardAnalyticsController = async (req, res) => {
  try {
    const data = await getDashboardAnalytics();
    res.json({
      success: true,
      message: "Dashboard analytics fetched",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch analytics",
      data: null,
    });
  }
};

export const verifyArtistController = async (req, res) => {
  try {
    const { isValid, value } = validateIdParam(req.params.id);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist id",
        data: null,
      });
    }

    const { isVerified } = req.body;
    const artist = await verifyArtist(value, isVerified);

    await logActivity({
      userId: req.admin.id,
      userType: "admin",
      userName: req.admin.name,
      action: "ADMIN_ARTIST_VERIFY",
      details: `Admin ${isVerified ? "approved/verified" : "suspended"} artist '${artist.name}' (ID: ${artist.id}).`,
      req,
    });

    res.json({
      success: true,
      message: "Artist verification status updated",
      data: artist,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update artist verification",
      data: null,
    });
  }
};

export const getTechHealthController = async (req, res) => {
  try {
    // Only super_admin or tech_lead roles are authorized
    if (req.admin.role !== "super_admin" && req.admin.role !== "tech_lead") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access restricted to Technical Leads and Super Admins",
        data: null,
      });
    }

    const data = await getTechHealth();
    res.json({
      success: true,
      message: "Technical status fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch technical status",
      data: null,
    });
  }
};

export const getActivityLogsController = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(
      req.query.page,
      req.query.limit
    );
    const result = await getActivityLogs({
      bookingId: req.query.bookingId,
      userId: req.query.userId,
      userType: req.query.userType,
      limit,
      offset,
    });

    res.json({
      success: true,
      message: "Activity logs fetched",
      data: {
        items: result.rows,
        total: result.count,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity logs",
      data: null,
    });
  }
};
