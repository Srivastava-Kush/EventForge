/**
 * Custom application error. Extends Error with an HTTP status code,
 * an optional array of field-level errors, and a flag marking it as operational
 * (expected, user-facing) so the global error handler can log appropriately.
 */
export class AppError extends Error {
  /**
   * @param {string} message   User-facing error message.
   * @param {number} statusCode HTTP status code (default 500).
   * @param {any[]}  [errors]   Optional field-level errors array.
   */
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
