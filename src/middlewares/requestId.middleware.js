import { randomUUID } from "node:crypto";

/**
 * Attaches a unique correlation ID to every incoming request.
 * If the client already supplies an X-Request-Id header, that ID is preserved.
 * The ID is set on req.id and sent back in the X-Request-Id response header.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function requestIdMiddleware(req, res, next) {
  const reqId = (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"].trim())
    ? req.headers["x-request-id"].trim()
    : randomUUID();

  req.id = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
}
