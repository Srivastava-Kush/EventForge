import { describe, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { validate } from "../src/middlewares/validate.js";
import {
  createTaskValidator,
  updateTaskValidator,
  createVendorValidator,
  updateVendorValidator,
  createExpenseValidator,
  updateExpenseValidator,
  createGuestValidator,
  updateGuestValidator,
  createScheduleItemValidator,
  updateScheduleItemValidator,
} from "../src/validators/subEntity.validator.js";
import { HTTP_STATUS } from "../src/constants/httpStatus.js";

async function runValidation(validators, body) {
  const app = express();
  app.use(express.json());

  app.post("/test", validators, validate, (req, res) => {
    res.json({ ok: true, body: req.body });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  });

  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { status: res.status, json };
  } finally {
    server.close();
  }
}

describe("Sub-Entity Route Validators", () => {
  describe("Task Validators", () => {
    test("rejects createTask with empty title", async () => {
      const res = await runValidation(createTaskValidator, { title: "   " });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      assert.equal(res.json.errors[0].field, "title");
    });

    test("rejects createTask with invalid status enum", async () => {
      const res = await runValidation(createTaskValidator, { title: "Test task", status: "invalid_status" });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      assert.equal(res.json.errors[0].field, "status");
    });

    test("accepts valid createTask payload", async () => {
      const res = await runValidation(createTaskValidator, {
        title: "Order wedding cake",
        phase: "Plan & book",
        status: "pending",
        urgent: true,
      });
      assert.equal(res.status, HTTP_STATUS.OK);
    });

    test("accepts valid updateTask payload", async () => {
      const res = await runValidation(updateTaskValidator, {
        title: "Updated task title",
        status: "completed",
      });
      assert.equal(res.status, HTTP_STATUS.OK);
    });
  });

  describe("Vendor Validators", () => {
    test("rejects createVendor with empty category name", async () => {
      const res = await runValidation(createVendorValidator, { name: "" });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      assert.equal(res.json.errors[0].field, "name");
    });

    test("rejects createVendor with invalid bookingStatus", async () => {
      const res = await runValidation(createVendorValidator, {
        name: "Catering",
        bookingStatus: "unknown_status",
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test("rejects updateVendor with non-numeric quotationAmount", async () => {
      const res = await runValidation(updateVendorValidator, {
        quotationAmount: "not-a-number",
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test("accepts valid createVendor payload", async () => {
      const res = await runValidation(createVendorValidator, {
        name: "Photography",
        vendorName: "Artisan Studio",
        quotationAmount: 2500,
        bookingStatus: "contacted",
      });
      assert.equal(res.status, HTTP_STATUS.OK);
    });
  });

  describe("Expense Validators", () => {
    test("rejects createExpense with missing title", async () => {
      const res = await runValidation(createExpenseValidator, { category: "Decor" });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      assert.equal(res.json.errors[0].field, "title");
    });

    test("rejects createExpense with invalid status", async () => {
      const res = await runValidation(createExpenseValidator, {
        title: "Venue Deposit",
        status: "refunded_unsupported",
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test("accepts valid createExpense and updateExpense payloads", async () => {
      const res = await runValidation(createExpenseValidator, {
        title: "Sound System Rental",
        estimatedCost: 800,
        actualCost: 750,
        paidAmount: 200,
        status: "partially_paid",
      });
      assert.equal(res.status, HTTP_STATUS.OK);

      const updateRes = await runValidation(updateExpenseValidator, {
        actualCost: 800,
        status: "paid",
      });
      assert.equal(updateRes.status, HTTP_STATUS.OK);
    });
  });

  describe("Guest Validators", () => {
    test("rejects createGuest with empty name", async () => {
      const res = await runValidation(createGuestValidator, { name: "   " });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      assert.equal(res.json.errors[0].field, "name");
    });

    test("rejects createGuest with excessive plus-ones (>20)", async () => {
      const res = await runValidation(createGuestValidator, {
        name: "Alex Johnson",
        plusOnes: 25,
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test("rejects createGuest with invalid RSVP status", async () => {
      const res = await runValidation(createGuestValidator, {
        name: "Alex Johnson",
        rsvpStatus: "maybe_later",
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test("accepts valid createGuest and updateGuest", async () => {
      const res = await runValidation(createGuestValidator, {
        name: "Jordan Lee",
        email: "jordan@example.com",
        rsvpStatus: "accepted",
        plusOnes: 1,
      });
      assert.equal(res.status, HTTP_STATUS.OK);

      const updateRes = await runValidation(updateGuestValidator, {
        rsvpStatus: "declined",
      });
      assert.equal(updateRes.status, HTTP_STATUS.OK);
    });
  });

  describe("Schedule Item Validators", () => {
    test("rejects createScheduleItem with missing required fields", async () => {
      const res = await runValidation(createScheduleItemValidator, {
        startTime: "10:00 AM",
        // missing activity
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test("accepts valid createScheduleItem and updateScheduleItem", async () => {
      const res = await runValidation(createScheduleItemValidator, {
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        activity: "Guest Welcome & Cocktail Reception",
        location: "Grand Ballroom Foyer",
      });
      assert.equal(res.status, HTTP_STATUS.OK);

      const updateRes = await runValidation(updateScheduleItemValidator, {
        completed: true,
      });
      assert.equal(updateRes.status, HTTP_STATUS.OK);
    });
  });
});
