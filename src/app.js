import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { loadEnv } from "./config/env.js";
import { HTTP_STATUS } from "./constants/httpStatus.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { createRateLimiterMiddleware } from "./middlewares/rateLimiter.middleware.js";
import { sanitizeInputs } from "./middlewares/mongoSanitize.middleware.js";
import { createIdeasService } from "./services/llm.service.js";
import { configureEventService } from "./services/event.service.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import chatRoutes from "./routes/chat.routes.js";

/**
 * Creates and configures the Express application.
 * Mounts middleware, security headers, rate limiting, API routes, and global error handling.
 *
 * @param {object} [options]
 * @param {object} [options.ideasService] Custom ideas service override for testing
 * @param {object} [options.env] Custom environment configuration override
 * @returns {import("express").Express}
 */
export function createApp(options = {}) {
  const env = options.env || loadEnv();

  // Configure LLM client & ideas service
  let llmClient = null;
  if (env.hasCredentials) {
    if (env.apiKey?.startsWith("sk-ant-")) {
      llmClient = new Anthropic({ timeout: 30_000, maxRetries: 1 });
    } else {
      llmClient = new GoogleGenAI({ apiKey: env.apiKey });
    }
  }

  const ideasService =
    options.ideasService ||
    createIdeasService({
      client: llmClient,
      model: env.model,
    });
  configureEventService({ ideasService });

  const app = express();

  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }

  // Security: Helmet HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Performance: compress HTTP responses (gzip / deflate)
  app.use(compression());

  // Core parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Security: NoSQL operator injection sanitization
  app.use(sanitizeInputs);

  // Security: CORS hardening
  const allowedOrigins = env.corsOrigin
    ? env.corsOrigin.split(",").map((s) => s.trim())
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Security: Anti brute-force rate limiting for auth endpoints (15 req/min per client)
  const authLimiter = createRateLimiterMiddleware({ limit: 15, windowMs: 60_000 });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // Rate limit protection for resource-intensive and LLM endpoints
  const rateLimiter = createRateLimiterMiddleware({ limit: env.rateLimitPerMinute });
  app.use("/api/events", rateLimiter);
  app.use("/api/chat", rateLimiter);


  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/chat", chatRoutes);

  // Root endpoint
  app.get("/", (req, res) => {
    res.status(HTTP_STATUS.OK).json({ success: true, message: "Event Planner API is active." });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.status(HTTP_STATUS.OK).json({ success: true, data: { status: "ok" } });
  });

  // 404 for unmatched API routes
  app.use("/api", (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: "Route not found.", errors: [] });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

export const createExpressApp = createApp;
export default createApp;

