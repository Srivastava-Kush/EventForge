import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { protect } from "../src/middlewares/auth.middleware.js";
import * as authController from "../src/controllers/auth.controller.js";
import User from "../src/models/User.model.js";
import { HTTP_STATUS } from "../src/constants/httpStatus.js";

function mockResponse() {
  const res = {
    statusCode: null,
    body: null,
    cookies: {},
    clearedCookies: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, options) {
      this.cookies[name] = { val, options };
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies[name] = options;
      return this;
    },
  };
  return res;
}

describe("Auth Middleware & Controller Exhaustive Tests", () => {
  const origFindById = User.findById;

  afterEach(() => {
    User.findById = origFindById;
  });

  describe("protect middleware", () => {
    test("rejects request with 401 when no token is supplied", async () => {
      const req = { cookies: {}, headers: {} };
      let passedError = null;
      await protect(req, {}, (err) => {
        passedError = err;
      });

      assert.ok(passedError);
      assert.equal(passedError.statusCode, HTTP_STATUS.UNAUTHORIZED);
      assert.match(passedError.message, /Not authenticated/);
    });

    test("rejects request with 401 when token is invalid or corrupted", async () => {
      const req = { cookies: { token: "invalid.token.here" }, headers: {} };
      let passedError = null;
      await protect(req, {}, (err) => {
        passedError = err;
      });

      assert.ok(passedError);
      assert.equal(passedError.statusCode, HTTP_STATUS.UNAUTHORIZED);
      assert.match(passedError.message, /Invalid or expired/);
    });

    test("rejects request with 401 when token user no longer exists in DB", async () => {
      const secret = process.env.JWT_SECRET || "changeme-in-production";
      const validToken = jwt.sign({ id: "deleted-user-id" }, secret, { algorithm: "HS256" });

      const req = {
        cookies: {},
        headers: { authorization: `Bearer ${validToken}` },
      };

      User.findById = () => ({
        select: async () => null, // User was deleted
      });

      let passedError = null;
      await protect(req, {}, (err) => {
        passedError = err;
      });

      assert.ok(passedError);
      assert.equal(passedError.statusCode, HTTP_STATUS.UNAUTHORIZED);
      assert.match(passedError.message, /User no longer exists/);
    });

    test("forwards DB lookup error to next(err) if database throws", async () => {
      const secret = process.env.JWT_SECRET || "changeme-in-production";
      const validToken = jwt.sign({ id: "user-123" }, secret, { algorithm: "HS256" });

      const req = {
        cookies: { token: validToken },
        headers: {},
      };

      const dbError = new Error("DB Connection timed out");
      User.findById = () => ({
        select: async () => {
          throw dbError;
        },
      });

      let passedError = null;
      await protect(req, {}, (err) => {
        passedError = err;
      });

      assert.equal(passedError, dbError);
    });

    test("attaches user to req.user and proceeds on valid token", async () => {
      const secret = process.env.JWT_SECRET || "changeme-in-production";
      const validToken = jwt.sign({ id: "user-active-123" }, secret, { algorithm: "HS256" });

      const req = {
        cookies: { token: validToken },
        headers: {},
      };

      const mockUser = {
        _id: "user-active-123",
        name: "Alex Rivera",
        email: "alex@example.com",
      };

      User.findById = (id) => ({
        select: async () => (id === "user-active-123" ? mockUser : null),
      });

      let calledNext = false;
      await protect(req, {}, (err) => {
        assert.equal(err, undefined);
        calledNext = true;
      });

      assert.equal(calledNext, true);
      assert.equal(req.user, mockUser);
    });
  });

  describe("authController endpoints", () => {
    test("logout clears authentication cookie and returns 200", async () => {
      const req = {};
      const res = mockResponse();

      await authController.logout(req, res);
      assert.equal(res.statusCode, HTTP_STATUS.OK);
      assert.equal(res.body.success, true);
      assert.ok(res.clearedCookies.token);
      assert.equal(res.clearedCookies.token.httpOnly, true);
    });

    test("getMe returns authenticated user profile with 200", async () => {
      const req = {
        user: {
          id: "usr-456",
          name: "Sam Taylor",
          email: "sam@example.com",
          createdAt: new Date().toISOString(),
        },
      };
      const res = mockResponse();

      await authController.getMe(req, res);
      assert.equal(res.statusCode, HTTP_STATUS.OK);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.id, "usr-456");
      assert.equal(res.body.data.user.name, "Sam Taylor");
    });
  });
});
