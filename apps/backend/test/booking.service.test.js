import test, { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert";
import {
  createRazorpayOrderService,
  verifyPaymentService,
  handleRazorpayWebhookService,
  checkAndExpireBookings,
} from "../src/modules/booking/booking.service.js";
import Booking from "../src/models/Booking.js";
import sequelize from "../src/config/db.js";
import * as razorpayUtil from "../src/utils/razorpay.js";

describe("Booking Service - Razorpay", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it("should fail to create order if booking is already paid", async () => {
    mock.method(Booking, "findOne", async () => ({
      status: "accepted",
      paymentStatus: "paid",
    }));

    await assert.rejects(
      createRazorpayOrderService({ bookingId: 1, customerId: 1 }),
      /Booking is already paid/
    );
  });

  it("should fail to create order if booking not found", async () => {
    mock.method(Booking, "findOne", async () => null);

    await assert.rejects(
      createRazorpayOrderService({ bookingId: 1, customerId: 1 }),
      /Booking not found/
    );
  });

  it("should fail to create order if booking is not accepted", async () => {
    mock.method(Booking, "findOne", async () => ({
      status: "pending",
      paymentStatus: "unpaid",
    }));

    await assert.rejects(
      createRazorpayOrderService({ bookingId: 1, customerId: 1 }),
      /Payment can only be made for accepted bookings/
    );
  });

  it("should prevent duplicate payment verification", async () => {
    mock.method(Booking, "findOne", async () => ({
      id: 1,
      paymentStatus: "paid",
    }));

    const result = await verifyPaymentService({
      bookingId: 1,
      customerId: 1,
      razorpayOrderId: "order_123",
      razorpayPaymentId: "pay_123",
    });

    assert.strictEqual(result.paymentStatus, "paid");
  });

  it("should ignore duplicate webhook deliveries safely", async () => {
    mock.method(Booking, "findOne", async () => ({
      id: 1,
      paymentStatus: "paid",
      razorpayOrderId: "order_123",
    }));

    const result = await handleRazorpayWebhookService("payment.captured", {
      payment: { entity: { id: "pay_123", order_id: "order_123" } },
    });

    assert.strictEqual(result.ignored, true);
    assert.strictEqual(result.message, "Already paid");
  });

  it("should reject invalid webhook events", async () => {
    const result = await handleRazorpayWebhookService("payment.failed", {});
    assert.strictEqual(result.ignored, true);
  });

  it("should fail payment verification if order mismatch", async () => {
    mock.method(Booking, "findOne", async () => ({
      id: 1,
      paymentStatus: "order_created",
      razorpayOrderId: "order_123",
    }));

    await assert.rejects(
      verifyPaymentService({
        bookingId: 1,
        customerId: 1,
        razorpayOrderId: "order_456",
        razorpayPaymentId: "pay_123",
      }),
      /Order ID mismatch/
    );
  });

  it("should auto-reject pending bookings older than 15 minutes", async () => {
    let updateCalls = [];
    mock.method(Booking, "update", async (values, options) => {
      updateCalls.push({ values, options });
      return [1];
    });

    await checkAndExpireBookings();

    assert.strictEqual(updateCalls.length, 3);
    // First call should be for pending bookings older than 15 minutes
    assert.strictEqual(updateCalls[0].values.status, "rejected");
    assert.strictEqual(updateCalls[0].values.cancelledBy, "system");
    assert.strictEqual(updateCalls[0].values.rejectionReason, "Auto-rejected: Artist did not respond within 15 minutes");
    assert.strictEqual(updateCalls[0].options.where.status, "pending");
  });

  it("should fail to start service if before makeup photo is missing", async () => {
    const { startBooking } = await import("../src/modules/booking/booking.service.js");
    mock.method(Booking, "findOne", async () => ({
      id: 1,
      artistId: 1,
      status: "confirmed",
      startOtp: "1234",
    }));

    await assert.rejects(
      startBooking({ bookingId: 1, artistId: 1, otp: "1234" }),
      /Please upload a before makeup look photo/
    );
  });

  it("should successfully generate end OTP and complete service with after photo", async () => {
    const { requestEndBookingOtp, completeBooking } = await import("../src/modules/booking/booking.service.js");
    
    let savedBooking = {
      id: 1,
      artistId: 1,
      status: "in_progress",
      endOtp: "9999",
      price: 2500,
      save: async () => {},
    };

    mock.method(Booking, "findOne", async () => savedBooking);

    const endOtpRes = await requestEndBookingOtp({ bookingId: 1, artistId: 1 });
    assert.strictEqual(endOtpRes.endOtp, "9999");

    const completed = await completeBooking({
      bookingId: 1,
      artistId: 1,
      otp: "9999",
      afterMakeupImage: "https://example.com/after.jpg",
    });

    assert.strictEqual(completed.status, "completed");
    assert.strictEqual(completed.afterMakeupImage, "https://example.com/after.jpg");
    assert.strictEqual(completed.totalPaid, 2500);
  });
});
