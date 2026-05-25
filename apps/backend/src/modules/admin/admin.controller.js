import {
  changeAdminPassword,
  getAdminProfile,
  getDashboardAnalytics,
  listArtists,
  listBookings,
  listCustomers,
  updateBookingStatus,
} from "./admin.service.js";
import {
  getPagination,
  validateBookingStatus,
  validateIdParam,
  validatePasswordChange,
} from "../../validators/admin.validator.js";

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

    if (!validateBookingStatus(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
        data: null,
      });
    }

    const booking = await updateBookingStatus({
      bookingId: value,
      status: req.body.status,
    });

    res.json({
      success: true,
      message: "Booking status updated",
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
