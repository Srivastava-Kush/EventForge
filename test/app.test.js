import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/app.js";
import { HTTP_STATUS } from "../src/constants/httpStatus.js";

/** Starts an app instance on a random port for testing */
async function startApp(options = {}) {
  const app = createApp(options);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  return {
    base,
    port,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

describe("Express MERN Application API", () => {
  let app;

  before(async () => {
    app = await startApp();
  });

  after(async () => {
    await app.close();
  });

  describe("Root and Health Endpoints", () => {
    test("GET / returns 200 with API status message", async () => {
      const res = await fetch(`${app.base}/`);
      assert.equal(res.status, HTTP_STATUS.OK);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.match(json.message, /Event Planner API/);
    });

    test("GET /api/health returns 200 with status ok", async () => {
      const res = await fetch(`${app.base}/api/health`);
      assert.equal(res.status, HTTP_STATUS.OK);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.deepEqual(json.data, { status: "ok" });
    });
  });

  describe("Security Headers (Helmet)", () => {
    test("includes security headers on all responses", async () => {
      const res = await fetch(`${app.base}/api/health`);
      assert.equal(res.headers.get("x-content-type-options"), "nosniff");
      assert.equal(res.headers.get("x-frame-options"), "SAMEORIGIN");
    });
  });

  describe("Compression Middleware", () => {
    test("supports gzip compression when requested", async () => {
      const res = await fetch(`${app.base}/api/health`, {
        headers: { "Accept-Encoding": "gzip" },
      });
      assert.equal(res.status, HTTP_STATUS.OK);
    });
  });

  describe("Request Validation and Limits", () => {
    test("rejects malformed JSON body with 400 Bad Request", async () => {
      const res = await fetch(`${app.base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"email": "test@example.com", "password": ',
      });
      assert.equal(res.status, HTTP_STATUS.BAD_REQUEST);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /JSON/i);
    });

    test("rejects oversized payload (>10MB) with 413 Payload Too Large", async () => {
      const hugeData = "x".repeat(11 * 1024 * 1024);
      const res = await fetch(`${app.base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hugeData }),
      });
      assert.equal(res.status, HTTP_STATUS.PAYLOAD_TOO_LARGE);
    });

    test("POST /api/auth/register fails validation on empty body with 422", async () => {
      const res = await fetch(`${app.base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(Array.isArray(json.errors));
      assert.ok(json.errors.length > 0);
    });

    test("POST /api/auth/register validates short password and invalid email", async () => {
      const res = await fetch(`${app.base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "A", email: "not-an-email", password: "123" }),
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      const json = await res.json();
      assert.equal(json.success, false);
      const fields = json.errors.map((e) => e.path || e.field);
      assert.ok(fields.includes("email"));
      assert.ok(fields.includes("password"));
    });

    test("POST /api/auth/login validates required fields", async () => {
      const res = await fetch(`${app.base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid" }),
      });
      assert.equal(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(json.errors.length >= 1);
    });
  });

  describe("Authentication & Route Protection", () => {
    test("GET /api/auth/me returns 401 Unauthorized without token", async () => {
      const res = await fetch(`${app.base}/api/auth/me`);
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.match(json.message, /not authenticated/i);
    });

    test("GET /api/events returns 401 Unauthorized without token", async () => {
      const res = await fetch(`${app.base}/api/events`);
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
      const json = await res.json();
      assert.equal(json.success, false);
    });

    test("POST /api/events returns 401 Unauthorized without token", async () => {
      const res = await fetch(`${app.base}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "wedding" }),
      });
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
    });

    test("GET /api/events/:id returns 401 Unauthorized without token", async () => {
      const res = await fetch(`${app.base}/api/events/60d5ec49f1b2c8b1f8e4e1a1`);
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
    });

    test("POST /api/chat/:eventId/message returns 401 Unauthorized without token", async () => {
      const res = await fetch(`${app.base}/api/chat/60d5ec49f1b2c8b1f8e4e1a1/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello" }),
      });
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
    });

    test("rejects forged or invalid Bearer token with 401", async () => {
      const res = await fetch(`${app.base}/api/auth/me`, {
        headers: { Authorization: "Bearer definitely-not-a-valid-jwt-token" },
      });
      assert.equal(res.status, HTTP_STATUS.UNAUTHORIZED);
      const json = await res.json();
      assert.match(json.message, /invalid or expired session/i);
    });

    test("POST /api/auth/logout succeeds and clears cookie", async () => {
      const res = await fetch(`${app.base}/api/auth/logout`, { method: "POST" });
      assert.equal(res.status, HTTP_STATUS.OK);
      const json = await res.json();
      assert.equal(json.success, true);
    });
  });

  describe("404 Route Not Found", () => {
    test("returns standard 404 response for unmatched API routes", async () => {
      const res = await fetch(`${app.base}/api/unmatched-endpoint-path`);
      assert.equal(res.status, HTTP_STATUS.NOT_FOUND);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.message, "Route not found.");
    });
  });
});
