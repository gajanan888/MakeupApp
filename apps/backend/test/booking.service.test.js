import test, { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert";
import {
  createRazorpayOrderService,
  verifyPaymentService,
  handleRazorpayWebhookService,
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
});
