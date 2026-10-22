import { RateLimiter, clientBucket } from "../lib/rateLimiter.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { loadEnv } from "../config/env.js";

/**
 * Creates an Express middleware that rate limits requests based on client IP.
 * Uses the sliding-window RateLimiter in src/lib/rateLimiter.js.
 *
 * @param {object} [options]
 * @param {number} [options.limit] Requests allowed per window
 * @param {number} [options.windowMs] Window length in milliseconds
 * @returns {import("express").RequestHandler}
 */
export function createRateLimiterMiddleware(options = {}) {
  let defaultLimit;
  try {
    defaultLimit = loadEnv().rateLimitPerMinute;
  } catch {
    defaultLimit = 20;
  }
  const limit = options.limit ?? defaultLimit;
  const windowMs = options.windowMs ?? 60_000;
  const limiter = new RateLimiter({ limit, windowMs });

  return (req, res, next) => {
    const rawIp = req.ip || req.socket?.remoteAddress || "127.0.0.1";
    const bucket = clientBucket(rawIp);
    const result = limiter.check(bucket);

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: "Too many requests. Please slow down.",
        retryAfter: result.retryAfterSeconds,
        errors: [],
      });
    }

    next();
  };
}
