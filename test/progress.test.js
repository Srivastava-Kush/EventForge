import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeMetrics } from "../src/services/eventMetrics.service.js";
import { generateSvgPoster } from "../src/services/poster.service.js";

describe("Event Progress & Budget Metrics Computation", () => {
  test("calculates accurate task progress and overdue status", () => {
    const mockEvent = {
      tasks: [
        { id: "1", status: "completed", dueDate: "2026-01-01" },
        { id: "2", status: "pending", dueDate: "2020-01-01" }, // overdue
        { id: "3", status: "pending", dueDate: "2030-01-01" }, // future
      ],
      vendors: [],
      expenses: [],
      guests: [],
      schedule: [],
    };

    const metrics = computeMetrics(mockEvent);
    assert.equal(metrics.tasks.total, 3);
    assert.equal(metrics.tasks.completed, 1);
    assert.equal(metrics.tasks.pending, 2);
    assert.equal(metrics.tasks.overdue, 1);
    assert.equal(metrics.tasks.progressPercent, 33);
  });

  test("calculates vendor booking progress separately from tasks", () => {
    const mockEvent = {
      tasks: [{ id: "t1", status: "pending" }],
      vendors: [
        { id: "v1", bookingStatus: "booked" },
        { id: "v2", bookingStatus: "contacted" },
        { id: "v3", bookingStatus: "pending" },
        { id: "v4", bookingStatus: "declined" },
      ],
      expenses: [],
      guests: [],
      schedule: [],
    };

    const metrics = computeMetrics(mockEvent);
    assert.equal(metrics.vendors.total, 4);
    assert.equal(metrics.vendors.booked, 1);
    assert.equal(metrics.vendors.contacted, 1);
    assert.equal(metrics.vendors.pending, 1);
    assert.equal(metrics.vendors.declined, 1);
    assert.equal(metrics.vendors.progressPercent, 25);
  });

  test("prevents expenses from being counted twice when linked to both tasks and vendors", () => {
    const mockEvent = {
      plan: { budget: { total: 10000, currency: "USD" } },
      tasks: [{ id: "t1" }],
      vendors: [{ id: "v1" }],
      expenses: [
        {
          id: "e1",
          title: "Catering",
          estimatedCost: 3000,
          actualCost: 3200,
          paidAmount: 2000,
          linkedVendorId: "v1", // linked to vendor
          linkedTaskId: "t1",   // AND linked to task
        },
        {
          id: "e2",
          title: "Photography",
          estimatedCost: 1500,
          actualCost: 1500,
          paidAmount: 1500,
          linkedVendorId: "v1",
        },
      ],
      guests: [],
      schedule: [],
    };

    const metrics = computeMetrics(mockEvent);
    // Total actual cost must be exactly 3200 + 1500 = 4700 (NOT double counted)
    assert.equal(metrics.budget.totalActualCost, 4700);
    assert.equal(metrics.budget.totalPaidAmount, 3500);
    assert.equal(metrics.budget.outstandingBalance, 1200);
    assert.equal(metrics.budget.remainingBudget, 5300);
    assert.equal(metrics.budget.isOverBudget, false);
    assert.equal(metrics.budget.spentPercentage, 47);
  });

  test("calculates guest attendance including plus-ones accurately", () => {
    const mockEvent = {
      tasks: [],
      vendors: [],
      expenses: [],
      guests: [
        { id: "g1", rsvpStatus: "attending", plusOnes: 2 }, // 1 + 2 = 3
        { id: "g2", rsvpStatus: "attending", plusOnes: 0 }, // 1
        { id: "g3", rsvpStatus: "declined", plusOnes: 1 },  // 0 attending
        { id: "g4", rsvpStatus: "pending", plusOnes: 1 },   // 0 attending yet
      ],
      schedule: [],
    };

    const metrics = computeMetrics(mockEvent);
    assert.equal(metrics.guests.totalInvited, 4);
    assert.equal(metrics.guests.attending, 4); // 3 from g1, 1 from g2
    assert.equal(metrics.guests.declined, 1);
    assert.equal(metrics.guests.pending, 1);
  });

  test("generates SVG poster graphic with styling and sanitized text", () => {
    for (const style of ["modern", "luxury", "botanical", "neon"]) {
      const svg = generateSvgPoster({
        title: "Priya's 30th Birthday",
        subtitle: "Boho Chic Garden Party",
        date: "2026-08-15",
        location: "Rosewood Gardens",
        style,
      });

      assert.ok(svg.includes("<svg"));
      assert.ok(svg.includes("Priya&#39;s 30th Birthday") || svg.includes("Priya"));
      assert.ok(svg.includes("2026-08-15"));
      assert.ok(svg.includes("Rosewood Gardens"));
    }
  });

  test("calculates over-budget flags correctly", () => {
    const mockEvent = {
      plan: { budget: { total: 5000, currency: "USD" } },
      tasks: [],
      vendors: [],
      expenses: [{ id: "e1", actualCost: 6000, paidAmount: 6000 }],
      guests: [],
      schedule: [],
    };
    const metrics = computeMetrics(mockEvent);
    assert.equal(metrics.budget.remainingBudget, -1000);
    assert.equal(metrics.budget.isOverBudget, true);
    assert.equal(metrics.budget.spentPercentage, 120);
  });

  test("calculates overall progress properly when tasks and vendors are empty or filled", () => {
    const emptyEvent = { tasks: [], vendors: [], expenses: [], guests: [], schedule: [] };
    assert.equal(computeMetrics(emptyEvent).overallProgress, 0);

    const fullEvent = {
      tasks: [{ id: "1", status: "completed" }],
      vendors: [{ id: "1", bookingStatus: "booked" }],
      expenses: [],
      guests: [],
      schedule: [{ id: "1", completed: true }],
    };
    const metrics = computeMetrics(fullEvent);
    assert.equal(metrics.overallProgress, 100);
  });
});
