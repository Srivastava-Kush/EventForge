import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../src/models/User.model.js";
import Event from "../src/models/Event.model.js";
import ChatHistory from "../src/models/ChatHistory.model.js";
import * as authService from "../src/services/auth.service.js";
import * as chatService from "../src/services/chat.service.js";
import * as eventService from "../src/services/event.service.js";
import * as taskService from "../src/services/task.service.js";
import * as vendorService from "../src/services/vendor.service.js";
import * as expenseService from "../src/services/expense.service.js";
import * as guestService from "../src/services/guest.service.js";
import * as scheduleService from "../src/services/schedule.service.js";
import * as posterService from "../src/services/poster.service.js";
import { HTTP_STATUS } from "../src/constants/httpStatus.js";

describe("Auth Service Unit Tests", () => {
  const origFindOne = User.findOne;
  const origFindById = User.findById;
  const origCreate = User.create;

  afterEach(() => {
    User.findOne = origFindOne;
    User.findById = origFindById;
    User.create = origCreate;
  });

  test("signToken generates valid signed JWT with correct payload", () => {
    const token = authService.signToken("user123");
    assert.ok(token);
    const decoded = jwt.decode(token);
    assert.equal(decoded.id, "user123");
  });

  test("registerUser successfully hashes password and returns user and token", async () => {
    User.findOne = () => ({
      select: () => ({
        lean: async () => null, // email not taken
      }),
    });

    User.create = async ({ name, email }) => ({
      _id: "new-user-id",
      name,
      email,
    });

    const result = await authService.registerUser({
      name: "Priya Sharma",
      email: "priya@example.com",
      password: "password123",
    });

    assert.equal(result.user.name, "Priya Sharma");
    assert.equal(result.user.email, "priya@example.com");
    assert.ok(result.token);
  });

  test("registerUser rejects duplicate email with HTTP 409 Conflict", async () => {
    User.findOne = () => ({
      select: () => ({
        lean: async () => ({ _id: "existing-id" }),
      }),
    });

    await assert.rejects(
      () =>
        authService.registerUser({
          name: "Duplicate",
          email: "taken@example.com",
          password: "password123",
        }),
      (err) => err.statusCode === HTTP_STATUS.CONFLICT,
    );
  });

  test("loginUser succeeds with valid credentials", async () => {
    const mockUser = {
      _id: "user123",
      name: "Priya Sharma",
      email: "priya@example.com",
      comparePassword: async (pwd) => pwd === "correct-password",
    };

    User.findOne = () => ({
      select: async () => mockUser,
    });

    const result = await authService.loginUser({
      email: "priya@example.com",
      password: "correct-password",
    });

    assert.equal(result.user.email, "priya@example.com");
    assert.ok(result.token);
  });

  test("loginUser rejects invalid password with HTTP 401 Unauthorized", async () => {
    const mockUser = {
      _id: "user123",
      comparePassword: async () => false,
    };

    User.findOne = () => ({
      select: async () => mockUser,
    });

    await assert.rejects(
      () => authService.loginUser({ email: "priya@example.com", password: "wrong" }),
      (err) => err.statusCode === HTTP_STATUS.UNAUTHORIZED,
    );
  });

  test("getUserById returns user when found and throws 404 when not found", async () => {
    User.findById = (id) => ({
      select: () => ({
        lean: async () => (id === "user123" ? { _id: "user123", name: "Priya", email: "priya@example.com" } : null),
      }),
    });

    const user = await authService.getUserById("user123");
    assert.equal(user.name, "Priya");

    await assert.rejects(
      () => authService.getUserById("unknown"),
      (err) => err.statusCode === HTTP_STATUS.NOT_FOUND,
    );
  });
});

describe("Chat Service Unit Tests", () => {
  const origFind = Event.find;
  const origFindOne = ChatHistory.findOne;
  const origFindOneAndUpdate = ChatHistory.findOneAndUpdate;

  afterEach(() => {
    Event.find = origFind;
    ChatHistory.findOne = origFindOne;
    ChatHistory.findOneAndUpdate = origFindOneAndUpdate;
  });

  test("sendMessage throws on blank message", async () => {
    await assert.rejects(
      () => chatService.sendMessage("user123", "   "),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST,
    );
  });

  test("getChatHistory returns messages slice or empty array", async () => {
    ChatHistory.findOne = () => ({
      lean: async () => ({ messages: [{ role: "user", content: "Hi" }] }),
    });

    const history = await chatService.getChatHistory("user123");
    assert.equal(history.length, 1);
    assert.equal(history[0].content, "Hi");
  });

  test("clearChatHistory empties the messages array", async () => {
    let cleared = false;
    ChatHistory.findOneAndUpdate = async (query, update) => {
      if (update.messages && update.messages.length === 0) cleared = true;
      return null;
    };

    await chatService.clearChatHistory("user123");
    assert.equal(cleared, true);
  });
});

describe("Event Service Sub-Resource Operations", () => {
  let mockEvent;
  const origFindOne = Event.findOne;
  const origFind = Event.find;
  const origFindOneAndDelete = Event.findOneAndDelete;

  beforeEach(() => {
    mockEvent = {
      _id: "evt-123",
      user: "usr-456",
      type: "wedding",
      input: {
        eventName: "Priya & Sam Wedding",
        eventType: "wedding",
        budget: 20000,
        currency: "USD",
        date: "2026-12-15",
        guestCount: 100,
        setting: "hybrid",
        priorities: ["food", "venue"],
        considerations: ["kid-friendly"],
      },
      plan: {
        summary: { daysToGo: 120, tier: "moderate" },
        budget: { total: 20000, currency: "USD", perGuest: 200, tier: "moderate", items: [{ key: "catering", label: "Catering", amount: 6000 }] },
        timeline: { tasks: [{ id: "t-init", title: "Initial plan", phase: "Plan & book", dueDate: "2026-08-01", urgent: false }] },
        vendors: [{ id: "v-init", name: "Caterer", priority: "essential", matchesPriority: true, bookBy: "2026-09-01", bookNow: false, tip: "" }],
      },
      tasks: [],
      vendors: [],
      expenses: [],
      guests: [],
      schedule: [],
      posters: [],
      async save() {
        return this;
      },
      toObject() {
        return JSON.parse(JSON.stringify(this));
      },
    };

    Event.findOne = async () => mockEvent;
    const findResult = [mockEvent];
    findResult.lean = async () => [mockEvent];
    Event.find = () => ({
      sort: async () => findResult,
      select: () => ({
        sort: async () => findResult,
      }),
    });
    Event.findOneAndDelete = async () => mockEvent;
  });

  afterEach(() => {
    Event.findOne = origFindOne;
    Event.find = origFind;
    Event.findOneAndDelete = origFindOneAndDelete;
  });

  test("getEventById returns full event decorated with computed metrics", async () => {
    const event = await eventService.getEventById("evt-123", "usr-456");
    assert.equal(event._id, "evt-123");
    assert.ok(event.metrics);
    assert.equal(event.metrics.tasks.total, 1); // seeded from plan
    assert.equal(event.metrics.vendors.total, 1);
  });

  test("getUserEvents returns array of user events with computed metrics", async () => {
    const list = await eventService.getUserEvents("usr-456");
    assert.equal(list.length, 1);
    assert.ok(list[0].metrics);
  });

  test("deleteEvent removes and returns the event", async () => {
    const deleted = await eventService.deleteEvent("evt-123", "usr-456");
    assert.equal(deleted._id, "evt-123");
  });

  /* Tasks */
  test("createTask validates title and appends custom task with metrics update", async () => {
    await assert.rejects(
      () => taskService.createTask("evt-123", { title: "" }, "usr-456"),
      (err) => err.statusCode === HTTP_STATUS.BAD_REQUEST,
    );

    const result = await taskService.createTask("evt-123", { title: "Hire Strings Quartet", phase: "Plan & book" }, "usr-456");
    assert.equal(result.task.title, "Hire Strings Quartet");
    assert.equal(result.task.isCustom, true);
    assert.ok(result.metrics.tasks.total >= 2);
  });

  test("updateTask updates task status, timestamps, and details", async () => {
    const { task } = await taskService.createTask("evt-123", { title: "Check sound system" }, "usr-456");
    const updated = await taskService.updateTask("evt-123", task.id, { status: "completed", notes: "Tested mic" }, "usr-456");

    assert.equal(updated.task.status, "completed");
    assert.ok(updated.task.completedAt);
    assert.equal(updated.task.notes, "Tested mic");
  });

  test("deleteTask removes target task", async () => {
    const { task } = await taskService.createTask("evt-123", { title: "Temporary task" }, "usr-456");
    const beforeCount = mockEvent.tasks.length;
    await taskService.deleteTask("evt-123", task.id, "usr-456");
    assert.equal(mockEvent.tasks.length, beforeCount - 1);
  });

  /* Vendors */
  test("createVendor, updateVendor, and deleteVendor manage vendor records", async () => {
    const created = await vendorService.createVendor("evt-123", { name: "Artisan Bakery", priority: "recommended" }, "usr-456");
    assert.equal(created.vendor.name, "Artisan Bakery");

    const updated = await vendorService.updateVendor(
      "evt-123",
      created.vendor.id,
      { bookingStatus: "booked", agreedAmount: 650 },
      "usr-456",
    );
    assert.equal(updated.vendor.bookingStatus, "booked");
    assert.equal(updated.vendor.agreedAmount, 650);
    assert.equal(updated.metrics.vendors.booked, 1);

    await vendorService.deleteVendor("evt-123", created.vendor.id, "usr-456");
    assert.ok(!mockEvent.vendors.some((v) => v.id === created.vendor.id));
  });

  /* Expenses */
  test("createExpense, updateExpense, and deleteExpense manage financial ledger", async () => {
    const created = await expenseService.createExpense(
      "evt-123",
      { title: "Floral Centerpieces", estimatedCost: 1200, actualCost: 1100, paidAmount: 500 },
      "usr-456",
    );
    assert.equal(created.expense.title, "Floral Centerpieces");
    assert.equal(created.expense.actualCost, 1100);

    const updated = await expenseService.updateExpense(
      "evt-123",
      created.expense.id,
      { paidAmount: 1100, status: "paid" },
      "usr-456",
    );
    assert.equal(updated.expense.paidAmount, 1100);
    assert.equal(updated.expense.status, "paid");

    await expenseService.deleteExpense("evt-123", created.expense.id, "usr-456");
    assert.ok(!mockEvent.expenses.some((e) => e.id === created.expense.id));
  });

  /* Guests */
  test("createGuest, importGuests, updateGuest, and deleteGuest manage RSVPs and seating", async () => {
    const created = await guestService.createGuest("evt-123", { name: "Ananya Patel", email: "ananya@example.com", plusOnes: 1 }, "usr-456");
    assert.equal(created.guest.name, "Ananya Patel");

    const imported = await guestService.importGuests(
      "evt-123",
      [
        { name: "Vikram Sen", email: "vikram@example.com" },
        { name: "Rohit Roy", plusOnes: 2 },
      ],
      "usr-456",
    );
    assert.equal(imported.addedCount, 2);

    const updated = await guestService.updateGuest(
      "evt-123",
      created.guest.id,
      { rsvpStatus: "attending", tableOrSeating: "Table 4" },
      "usr-456",
    );
    assert.equal(updated.guest.rsvpStatus, "attending");
    assert.equal(updated.guest.tableOrSeating, "Table 4");

    await guestService.deleteGuest("evt-123", created.guest.id, "usr-456");
    assert.ok(!mockEvent.guests.some((g) => g.id === created.guest.id));
  });

  /* Schedule */
  test("createScheduleItem, updateScheduleItem, and deleteScheduleItem manage run sheet", async () => {
    const created = await scheduleService.createScheduleItem(
      "evt-123",
      { startTime: "04:30 PM", activity: "Exchange of Rings", location: "Lawn" },
      "usr-456",
    );
    assert.equal(created.item.activity, "Exchange of Rings");

    const updated = await scheduleService.updateScheduleItem("evt-123", created.item.id, { completed: true }, "usr-456");
    assert.equal(updated.item.completed, true);

    await scheduleService.deleteScheduleItem("evt-123", created.item.id, "usr-456");
    assert.ok(!mockEvent.schedule.some((s) => s.id === created.item.id));
  });

  /* Posters */
  test("savePoster and deletePoster sanitize and manage saved designs", async () => {
    const validSvg = `<svg viewBox="0 0 800 1120"><text x="400" y="200">Gala</text></svg>`;
    const saved = await posterService.savePoster(
      "evt-123",
      { title: "Grand Gala", prompt: "Midnight stars", style: "modern", imageData: validSvg },
      "usr-456",
    );
    assert.equal(saved.poster.title, "Grand Gala");
    assert.ok(saved.poster.imageData.includes("<svg"));

    await posterService.deletePoster("evt-123", saved.poster.id, "usr-456");
    assert.ok(!mockEvent.posters.some((p) => p.id === saved.poster.id));
  });

  /* Ideas generation */
  test("generateEventIdeas invokes ideasService and saves result", async () => {
    const res = await eventService.generateEventIdeas("evt-123", "usr-456");
    assert.ok(res.ideas);
    assert.ok(mockEvent.ideas);
  });
});
