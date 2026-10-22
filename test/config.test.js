import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../src/config/env.js";
import { DEFAULT_MODEL } from "../src/services/llm.service.js";

describe("loadEnv configuration", () => {
  test("uses safe defaults with an empty environment", () => {
    const config = loadEnv({});
    assert.equal(config.port, 3000);
    assert.equal(config.host, "127.0.0.1");
    assert.equal(config.model, DEFAULT_MODEL);
    assert.equal(config.rateLimitPerMinute, 20);
    assert.equal(config.trustProxy, false);
    assert.equal(config.hasCredentials, false);
    assert.equal(config.jwtExpiresIn, "7d");
  });

  test("reads every supported variable", () => {
    const config = loadEnv({
      PORT: "8080",
      HOST: "0.0.0.0",
      ANTHROPIC_MODEL: "claude-sonnet-5-5",
      RATE_LIMIT_PER_MINUTE: "5",
      TRUST_PROXY: "true",
      ANTHROPIC_API_KEY: "sk-test",
      MONGODB_URI: "mongodb://localhost:27017/test",
      JWT_SECRET: "secret123",
      JWT_EXPIRES_IN: "30d",
    });
    assert.equal(config.port, 8080);
    assert.equal(config.host, "0.0.0.0");
    assert.equal(config.model, "claude-sonnet-5-5");
    assert.equal(config.rateLimitPerMinute, 5);
    assert.equal(config.trustProxy, true);
    assert.equal(config.hasCredentials, true);
    assert.equal(config.mongoUri, "mongodb://localhost:27017/test");
    assert.equal(config.jwtSecret, "secret123");
    assert.equal(config.jwtExpiresIn, "30d");
  });

  test("treats empty strings as unset", () => {
    const config = loadEnv({
      PORT: "",
      HOST: "  ",
      ANTHROPIC_MODEL: "",
      RATE_LIMIT_PER_MINUTE: "",
      TRUST_PROXY: "",
      ANTHROPIC_API_KEY: "",
    });
    assert.equal(config.port, 3000);
    assert.equal(config.host, "127.0.0.1");
    assert.equal(config.model, DEFAULT_MODEL);
    assert.equal(config.hasCredentials, false);
  });

  test("detects an auth token as credentials", () => {
    assert.equal(loadEnv({ ANTHROPIC_AUTH_TOKEN: "token" }).hasCredentials, true);
  });

  test("detects GEMINI_API_KEY and GEMINI_MODEL", () => {
    const config = loadEnv({ GEMINI_API_KEY: "AIzaTestKey", GEMINI_MODEL: "gemini-3.5-flash" });
    assert.equal(config.hasCredentials, true);
    assert.equal(config.apiKey, "AIzaTestKey");
    assert.equal(config.model, "gemini-3.5-flash");
  });

  test("accepts port 0 for a random free port", () => {
    assert.equal(loadEnv({ PORT: "0" }).port, 0);
  });

  for (const PORT of ["abc", "-1", "65536", "3.5", "1e3x", "NaN"]) {
    test(`rejects PORT=${PORT}`, () => assert.throws(() => loadEnv({ PORT }), /PORT must be an integer/));
  }

  for (const RATE_LIMIT_PER_MINUTE of ["0", "-5", "10001", "ten"]) {
    test(`rejects RATE_LIMIT_PER_MINUTE=${RATE_LIMIT_PER_MINUTE}`, () =>
      assert.throws(() => loadEnv({ RATE_LIMIT_PER_MINUTE }), /RATE_LIMIT_PER_MINUTE/));
  }

  for (const [value, expected] of [["1", true], ["TRUE", true], ["yes", true], ["0", false], ["false", false], ["No", false]]) {
    test(`TRUST_PROXY=${value} → ${expected}`, () => assert.equal(loadEnv({ TRUST_PROXY: value }).trustProxy, expected));
  }

  test("rejects an unclear TRUST_PROXY value", () => {
    assert.throws(() => loadEnv({ TRUST_PROXY: "maybe" }), /TRUST_PROXY must be true or false/);
  });
});
