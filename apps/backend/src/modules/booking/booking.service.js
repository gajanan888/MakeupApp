import { Op } from "sequelize";
import Booking from "../../models/Booking.js";
import Artist from "../../models/Artist.js";
import Customer from "../../models/Customer.js";
import Review from "../../models/Review.js";
import ArtistBlock from "../../models/ArtistBlock.js";
import sequelize from "../../config/db.js";
import { getRazorpayInstance } from "../../utils/razorpay.js";

// Helper to auto-expire bookings that missed their response/payment deadline
export const checkAndExpireBookings = async () => {
  const now = new Date();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

  // 1. Auto-reject pending bookings if artist did not respond within 15 minutes
  await Booking.update(
    {
      status: "rejected",
      cancelledBy: "system",
      rejectionReason: "Auto-rejected: Artist did not respond within 15 minutes",
      cancellationReason: "Auto-rejected: Artist did not respond within 15 minutes",
    },
    {
      where: {
        status: "pending",
        createdAt: {
          [Op.lt]: fifteenMinsAgo,
        },
      },
    }
  );

  // 2. Auto-cancel accepted bookings that missed advance payment deadline
  await Booking.update(
    {
      status: "cancelled",
      cancelledBy: "system",
      cancellationReason: "Advance payment deadline expired",
    },
    {
      where: {
        status: "accepted",
        paymentDeadline: {
          [Op.ne]: null,
          [Op.lt]: now,
        },
      },
    }
  );
};

export const createBooking = async ({ customerId, artistId, date, time, category, price, location, addOns, hasInsurance = false, insuranceFee = 0, backupArtistId = null, totalPaid }) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist || !artist.isVerified) {
    throw new Error("Artist not found or not verified");
  }

  // Check conflicting booking that is pending, accepted, or confirmed/in_progress
  const conflicting = await Booking.findOne({
    where: {
      artistId,
      date,
      time,
      status: {
        [Op.in]: ["pending", "accepted", "confirmed", "in_progress"],
      },
    },
  });

  if (conflicting) {
    throw new Error("Artist is not available at that time");
  }

  // Calculate advance: 10% of base price + ensurance fee (if selected)
  const actualInsuranceFee = hasInsurance ? (insuranceFee || 1000) : 0;
  const basePrice = Math.max(0, (price || 0) - actualInsuranceFee);
  const advanceAmount = Math.round(basePrice * 0.10) + actualInsuranceFee;

  const parsedBackupId = (hasInsurance && backupArtistId) ? Number(backupArtistId) : null;

  const booking = await Booking.create({
    customerId,
    artistId,
    date,
    time,
    category,
    price,
    location,
    addOns,
    hasInsurance: !!hasInsurance,
    insuranceFee: actualInsuranceFee,
    backupArtistId: parsedBackupId,
    backupStatus: parsedBackupId ? "pending" : "none",
    totalPaid: 0,
    advanceAmount,
    advancePaid: false,
    status: "pending",
  });

  return booking;
};

export const listCustomerBookings = async ({ customerId, offset, limit }) => {
  await checkAndExpireBookings();
  return Booking.findAndCountAll({
    where: { customerId },
    include: [
      {
        model: Artist,
        as: "artist",
        attributes: ["id", "name", "phone", "profileImage", "rating", "location"],
      },
      {
        model: Artist,
        as: "backupArtist",
        attributes: ["id", "name", "phone", "profileImage", "rating", "location"],
        required: false,
      },
      {
        model: Review,
        as: "review",
        required: false,
      },
    ],
    order: [
      ["date", "DESC"],
      ["time", "DESC"],
    ],
    offset,
    limit,
  });
};

export const listArtistBookings = async ({ artistId, offset, limit }) => {
  await checkAndExpireBookings();
  const parsedId = Number(artistId);
  const { count, rows } = await Booking.findAndCountAll({
    where: {
      [Op.or]: [
        { artistId: parsedId },
        { backupArtistId: parsedId, hasInsurance: true },
      ],
    },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
      {
        model: Artist,
        as: "artist",
        attributes: ["id", "name", "phone", "profileImage"],
      },
      {
        model: Artist,
        as: "backupArtist",
        attributes: ["id", "name", "phone", "profileImage"],
        required: false,
      },
    ],
    order: [
      ["date", "DESC"],
      ["time", "DESC"],
    ],
    offset,
    limit,
  });

  const items = rows.map((b) => {
    const json = b.toJSON();
    json.isBackupBooking = json.backupArtistId === parsedId;
    return json;
  });

  return { count, rows: items };
};

export const acceptBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "pending") {
    throw new Error("Only pending bookings can be accepted");
  }

  booking.status = "accepted";
  await booking.save();

  return booking;
};

export const rejectBooking = async ({ bookingId, artistId, reason }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "pending") {
    throw new Error("Only pending bookings can be rejected");
  }

  booking.status = "rejected";
  booking.rejectionReason = reason || "No reason specified";
  await booking.save();

  return booking;
};

export const payAdvance = async ({ bookingId, customerId }) => {
  console.warn("DEPRECATED: payAdvance is being called. It should be replaced with Razorpay checkout.");
  const booking = await Booking.findOne({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "accepted") {
    throw new Error("Payment can only be made for accepted bookings");
  }

  booking.status = "confirmed";
  booking.advancePaid = true;
  booking.totalPaid = booking.advanceAmount;
  booking.paymentDeadline = null; // Clear timer
  await booking.save();

  return booking;
};

export const createRazorpayOrderService = async ({ bookingId, customerId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }
  if (booking.status !== "accepted") {
    throw new Error("Payment can only be made for accepted bookings");
  }
  if (booking.paymentStatus === "paid") {
    throw new Error("Booking is already paid");
  }

  const razorpay = getRazorpayInstance();
  const advanceAmount = Math.round((booking.price || 0) * 0.10);
  
  if (advanceAmount <= 0) {
    throw new Error("Invalid payment amount");
  }

  // Check if order exists and is valid
  if (booking.razorpayOrderId) {
    try {
      const existingOrder = await razorpay.orders.fetch(booking.razorpayOrderId);
      if (existingOrder && existingOrder.status === "created" && existingOrder.amount === advanceAmount * 100) {
        return {
          orderId: booking.razorpayOrderId,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: advanceAmount,
          currency: "INR"
        };
      }
    } catch (error) {
      console.warn("[PaymentService] Existing order fetch failed, creating new one.", error.message);
    }
  }

  const orderOptions = {
    amount: advanceAmount * 100, // Amount in paise
    currency: "INR",
    receipt: `receipt_booking_${booking.id}`,
  };

  const order = await razorpay.orders.create(orderOptions);

  booking.razorpayOrderId = order.id;
  booking.paymentStatus = "order_created";
  await booking.save();

  return {
    orderId: order.id,
    keyId: process.env.RAZORPAY_KEY_ID,
    amount: advanceAmount,
    currency: "INR"
  };
};

export const verifyPaymentService = async ({ bookingId, customerId, razorpayOrderId, razorpayPaymentId, isWebhook = false }) => {
  const whereClause = { id: bookingId };
  if (customerId) whereClause.customerId = customerId;

  const booking = await Booking.findOne({ where: whereClause });
  
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.paymentStatus === "paid") {
    console.log(`[PaymentService] Idempotency hit: Booking ${bookingId} is already paid.`);
    return booking; // Idempotent
  }

  if (booking.razorpayOrderId !== razorpayOrderId) {
    throw new Error("Order ID mismatch");
  }

  const razorpay = getRazorpayInstance();
  const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

  if (!paymentDetails || paymentDetails.status !== "captured") {
    throw new Error("Payment not captured in Razorpay");
  }
  
  if (paymentDetails.order_id !== razorpayOrderId) {
    throw new Error("Razorpay payment does not match the order ID");
  }
  
  if (paymentDetails.currency !== "INR") {
    throw new Error("Invalid currency");
  }

  const expectedAmount = Math.round((booking.price || 0) * 0.10) * 100;
  if (paymentDetails.amount !== expectedAmount) {
    throw new Error("Amount mismatch");
  }

  // Use a transaction to ensure atomicity
  const transaction = await sequelize.transaction();
  try {
    // Lock the row to prevent concurrent updates
    const lockedBooking = await Booking.findOne({ 
      where: { id: booking.id }, 
      transaction, 
      lock: transaction.LOCK.UPDATE 
    });

    if (lockedBooking.paymentStatus === "paid") {
      await transaction.rollback();
      return lockedBooking;
    }

    lockedBooking.status = "confirmed";
    lockedBooking.advancePaid = true;
    lockedBooking.totalPaid = (lockedBooking.totalPaid || 0) + (lockedBooking.advanceAmount || 0);
    lockedBooking.paymentStatus = "paid";
    lockedBooking.razorpayPaymentId = razorpayPaymentId;
    lockedBooking.paymentMethod = paymentDetails.method;
    lockedBooking.paidAt = new Date();
    lockedBooking.paymentDeadline = null;

    await lockedBooking.save({ transaction });

    // Assuming synchronous activity logging using models could go here,
    // but usually activity log requires userId/userName. If it's webhook, 
    // we might need to fetch the customer. Let's do it in the controller if needed.

    await transaction.commit();
    return lockedBooking;
  } catch (error) {
    await transaction.rollback();
    console.error(`[PaymentService] Rollback executed for booking ${bookingId}:`, error.message);
    throw new Error("Transaction failed during payment verification");
  }
};

export const handleRazorpayWebhookService = async (event, payload) => {
  if (event !== "payment.captured" && event !== "order.paid") {
    // Ignore unsupported events
    return { ignored: true };
  }

  const paymentDetails = payload.payment?.entity || payload.order?.entity;
  if (!paymentDetails) {
    throw new Error("Missing entity in webhook payload");
  }

  const razorpayOrderId = paymentDetails.order_id;
  const razorpayPaymentId = paymentDetails.id;

  const booking = await Booking.findOne({ where: { razorpayOrderId } });
  if (!booking) {
    console.warn(`[PaymentService] Webhook received for unknown order: ${razorpayOrderId}`);
    return { ignored: true };
  }

  if (booking.paymentStatus === "paid") {
    return { ignored: true, message: "Already paid" };
  }

  await verifyPaymentService({
    bookingId: booking.id,
    razorpayOrderId,
    razorpayPaymentId,
    isWebhook: true
  });
  
  return { success: true };
};

export const declineAdvancePayment = async ({ bookingId, customerId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, customerId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "accepted") {
    throw new Error("Can only decline payment for accepted bookings");
  }

  // Set 30-minute deadline from now
  booking.paymentDeadline = new Date(Date.now() + 30 * 60 * 1000);
  await booking.save();

  return booking;
};

export const cancelBooking = async ({ bookingId, customerId, artistId, reason }) => {
  // Can be cancelled by either customer or artist
  const where = { id: bookingId };
  if (customerId) where.customerId = customerId;
  if (artistId) where.artistId = artistId;

  const booking = await Booking.findOne({ where });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Allow cancellation of pending/accepted bookings normally
  if (["pending", "accepted"].includes(booking.status)) {
    booking.status = "cancelled";
    booking.cancelledBy = customerId ? "client" : "artist";
    booking.cancellationReason = reason || "Cancelled before confirmation";
    await booking.save();
    return booking;
  }

  // If already confirmed (paid)
  if (booking.status === "confirmed") {
    // Parse service date and time to check 36-hour limit
    // Example booking.date = "2026-06-25", booking.time = "09:00 AM"
    let hours = 12;
    let minutes = 0;
    if (booking.time) {
      const parts = booking.time.split(" ");
      const timeStr = parts[0];
      const ampm = parts[1] || "AM";
      const [h, m] = timeStr.split(":").map(Number);
      hours = h;
      minutes = m;
      if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }

    const serviceDate = new Date(`${booking.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
    const now = new Date();
    const diffHours = (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (customerId && diffHours < 36) {
      throw new Error("Cancellation is only allowed up to 36 hours before the service time.");
    }

    const serviceCharge = Math.round((booking.price || 0) * 0.02);

    if (customerId) {
      // Cancelled by client
      if (diffHours >= 36) {
        booking.status = "cancelled";
        booking.cancelledBy = "client";
        booking.cancellationReason = reason || "Client cancelled before 36h limit";
        booking.refundAmount = Math.max(0, (booking.advanceAmount || 0) - serviceCharge);
        booking.refundStatus = "refunded";
      } else {
        booking.status = "cancelled";
        booking.cancelledBy = "client";
        booking.cancellationReason = reason || "Client cancelled within 36h limit (No refund)";
        booking.refundAmount = 0;
        booking.refundStatus = "none";
      }
    } else {
      // Cancelled by artist
      if (diffHours >= 36) {
        booking.status = "cancelled";
        booking.cancelledBy = "artist";
        booking.cancellationReason = reason || "Artist cancelled before 36h limit (No penalty)";
        booking.refundAmount = booking.advanceAmount || 0;
        booking.refundStatus = "refunded";
        booking.artistPenalty = 0;
      } else {
        booking.status = "cancelled";
        booking.cancelledBy = "artist";
        booking.cancellationReason = reason || `Artist cancelled within 36h limit. Charged 2% penalty (₹${serviceCharge}).`;
        booking.refundAmount = booking.advanceAmount || 0;
        booking.refundStatus = "refunded";
        booking.artistPenalty = serviceCharge; // 2% of booking price charged to the artist
      }
    }

    await booking.save();
    return booking;
  }

  throw new Error("Booking cannot be cancelled in its current state.");
};

export const startBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can be started");
  }

  booking.status = "in_progress";
  await booking.save();

  return booking;
};

export const completeBooking = async ({ bookingId, artistId }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.status !== "in_progress") {
    throw new Error("Only in-progress bookings can be completed");
  }

  booking.status = "completed";
  // When completed, they pay the rest. Let's set totalPaid to full price.
  booking.totalPaid = booking.price;
  await booking.save();

  return booking;
};

export const getArtistBookedSlots = async (artistId) => {
  const bookings = await Booking.findAll({
    where: {
      artistId,
      status: {
        [Op.notIn]: ['rejected', 'cancelled']
      }
    },
    attributes: ['date', 'time']
  });

  const blocks = await ArtistBlock.findAll({
    where: { artistId },
    attributes: ['date', 'time']
  });

  const bookedSlots = bookings.map(b => ({ date: b.date, time: b.time }));
  const blockedSlots = blocks.map(b => ({ date: b.date, time: b.time }));

  return [...bookedSlots, ...blockedSlots];
};

export const addExtraClientsToBooking = async ({ bookingId, artistId, extraServices, additionalPrice, notes }) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, artistId },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
    ],
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (["rejected", "cancelled"].includes(booking.status)) {
    throw new Error("Cannot add extra customers to a cancelled or rejected booking");
  }

  let currentAddOns = [];
  if (booking.addOns) {
    if (Array.isArray(booking.addOns)) {
      currentAddOns = [...booking.addOns];
    } else if (typeof booking.addOns === 'object') {
      currentAddOns = [booking.addOns];
    }
  }

  const newAddOns = (extraServices || []).map(item => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    service: item.service || item.name || item.specialization || "Makeup Service",
    count: item.count || 1,
    unitPrice: item.unitPrice || item.price || 0,
    totalPrice: (item.unitPrice || item.price || 0) * (item.count || 1),
    notes: item.notes || notes || "",
    addedAt: new Date().toISOString(),
    addedBy: "artist",
  }));

  const updatedAddOns = [...currentAddOns, ...newAddOns];
  const newTotalPrice = (booking.price || 0) + (additionalPrice || 0);

  booking.addOns = updatedAddOns;
  booking.price = newTotalPrice;

  await booking.save();
  return booking;
};

export const createArtistDirectBooking = async ({ artistId, clientName, clientPhone, date, time, category, price, location, addOns }) => {
  let customer = null;
  const name = (clientName && clientName.trim()) ? clientName.trim() : "Walk-In Client";
  const phone = (clientPhone && clientPhone.trim()) ? clientPhone.trim() : null;

  if (phone) {
    customer = await Customer.findOne({ where: { phone } });
  }

  if (!customer) {
    const randomSuffix = Date.now() + "_" + Math.floor(Math.random() * 10000);
    customer = await Customer.create({
      name: name,
      phone: phone || `0000${Math.floor(100000 + Math.random() * 900000)}`,
      email: `walkin_${randomSuffix}@makeupapp.local`,
      password: `walkin_pass_${randomSuffix}`,
    });
  } else {
    customer.name = name;
    await customer.save();
  }

  const booking = await Booking.create({
    customerId: customer.id,
    artistId,
    date: date || new Date().toISOString().split('T')[0],
    time: time || '10:00 AM',
    category: category || 'Walk-In Booking',
    price: price || 0,
    location: location || 'Studio / On-Site',
    addOns: addOns || [],
    status: 'accepted',
    totalPaid: 0,
    advancePaid: false,
  });

  return booking;
};

