import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middlewares/errorHandler.js";
import { AppError } from "../src/utils/AppError.js";
import { HTTP_STATUS } from "../src/constants/httpStatus.js";

/** Helper to mock Express req, res, next */
function mockResponse() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe("Global Error Handler Unit Tests", () => {
  const req = {};
  const next = () => {};

  test("formats operational AppError with status and custom field errors", () => {
    const res = mockResponse();
    const err = new AppError("Invalid input", HTTP_STATUS.BAD_REQUEST, [
      { field: "budget", message: "Budget must be at least 50" },
    ]);

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.BAD_REQUEST);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid input");
    assert.deepEqual(res.body.errors, [{ field: "budget", message: "Budget must be at least 50" }]);
  });

  test("handles malformed JSON body SyntaxError from express.json() with 400", () => {
    const res = mockResponse();
    const err = new SyntaxError("Unexpected token in JSON");
    err.status = 400;
    err.body = "{ malformed ";

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.BAD_REQUEST);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Malformed JSON payload.");
    assert.deepEqual(res.body.errors, []);
  });

  test("handles entity.too.large (413 Payload Too Large)", () => {
    const res = mockResponse();
    const err = new Error("request entity too large");
    err.type = "entity.too.large";
    err.status = 413;

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.PAYLOAD_TOO_LARGE);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Request payload too large.");
  });

  test("handles Mongoose ValidationError (422 Unprocessable Entity)", () => {
    const res = mockResponse();
    const err = new Error("Validation failed");
    err.name = "ValidationError";
    err.errors = {
      email: { path: "email", message: "Email is required." },
      password: { path: "password", message: "Password too short." },
    };

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Validation failed.");
    assert.equal(res.body.errors.length, 2);
    assert.equal(res.body.errors[0].field, "email");
  });

  test("handles Mongoose CastError (400 Bad Request) for invalid IDs", () => {
    const res = mockResponse();
    const err = new Error("Cast to ObjectId failed");
    err.name = "CastError";
    err.path = "id";

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.BAD_REQUEST);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Invalid format for parameter 'id'/);
  });

  test("handles Mongoose duplicate key error (code 11000 -> 409 Conflict)", () => {
    const res = mockResponse();
    const err = new Error("E11000 duplicate key error");
    err.code = 11000;
    err.keyValue = { email: "priya@example.com" };

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.CONFLICT);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /email is already in use/);
  });

  test("handles JsonWebTokenError (401 Unauthorized)", () => {
    const res = mockResponse();
    const err = new Error("jwt malformed");
    err.name = "JsonWebTokenError";

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid token.");
  });

  test("handles TokenExpiredError (401 Unauthorized)", () => {
    const res = mockResponse();
    const err = new Error("jwt expired");
    err.name = "TokenExpiredError";

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Token has expired.");
  });

  test("handles unexpected non-operational programming errors with generic 500", () => {
    const res = mockResponse();
    const err = new TypeError("Cannot read property of undefined");

    errorHandler(err, req, res, next);
    assert.equal(res.statusCode, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Something went wrong. Please try again.");
    assert.deepEqual(res.body.errors, []);
  });
});
