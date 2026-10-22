import { DEFAULT_MODEL } from "../services/llm.service.js";

function integer(value, fallback, min, max, name) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max} (got "${value}").`);
  }
  return parsed;
}

function boolean(value, name) {
  if (value === undefined || value === "") return false;
  if (["1", "true", "yes"].includes(value.toLowerCase())) return true;
  if (["0", "false", "no"].includes(value.toLowerCase())) return false;
  throw new Error(`${name} must be true or false (got "${value}").`);
}

/**
 * Reads and validates all environment variables for the MERN stack app.
 * Fails fast with a readable message instead of starting with a broken setup.
 * @param {Record<string, string | undefined>} [env]
 */
export function loadEnv(env = process.env) {
  const apiKey = env.GEMINI_API_KEY?.trim() || env.ANTHROPIC_API_KEY?.trim() || env.ANTHROPIC_AUTH_TOKEN?.trim() || "";
  const model = env.GEMINI_MODEL?.trim() || env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  return {
    port: integer(env.PORT, 3000, 0, 65_535, "PORT"),
    host: env.HOST?.trim() || (env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
    model,
    rateLimitPerMinute: integer(env.RATE_LIMIT_PER_MINUTE, 20, 1, 10_000, "RATE_LIMIT_PER_MINUTE"),
    trustProxy: boolean(env.TRUST_PROXY, "TRUST_PROXY"),
    hasCredentials: Boolean(apiKey),
    apiKey,
    mongoUri: env.MONGODB_URI || "",
    jwtSecret: (() => {
      const secret = env.JWT_SECRET?.trim() || (env.NODE_ENV === "production" ? "" : "changeme-in-production");
      if (env.NODE_ENV === "production" && (!secret || secret === "changeme-in-production")) {
        throw new Error("JWT_SECRET must be configured with a secure secret in production.");
      }
      return secret;
    })(),
    jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
    nodeEnv: env.NODE_ENV || "development",
    corsOrigin: env.CORS_ORIGIN?.trim() || env.CLIENT_URL?.trim() || "",
  };
}

export const loadConfig = loadEnv;

