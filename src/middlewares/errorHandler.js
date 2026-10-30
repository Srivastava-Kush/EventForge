import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Global Express error handler. Registered after all routes.
 * Distinguishes operational errors (AppError) and known Mongoose/JSON/JWT errors
 * from unexpected programming errors.
 *
 * All API errors follow the unified shape: { success: false, message: "", errors: [] }
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Operational errors (AppError): expected, user-facing
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Malformed JSON request body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Malformed JSON payload.",
      errors: [],
    });
  }

  // Body parser payload too large (413)
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
      success: false,
      message: "Request payload too large.",
      errors: [],
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === "CastError") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Invalid format for parameter '${err.path}'.`,
      errors: [],
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `${field} is already in use.`,
      errors: [],
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Invalid token.",
      errors: [],
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Token has expired.",
      errors: [],
    });
  }

  // Unknown / programming error — log and return generic message
  console.error(`[errorHandler] Unexpected error [${req?.id || "unknown"}]:`, err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Something went wrong. Please try again.",
    errors: [],
  });
}

