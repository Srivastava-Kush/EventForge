/**
 * Sends a standardised API response.
 * Success: { success: true,  data: {} }
 * Error:   { success: false, message: "", errors: [] }
 *
 * @param {import("express").Response} res
 * @param {number}  statusCode  HTTP status code
 * @param {boolean} success     true for success, false for error
 * @param {*}       data        Payload for success responses
 * @param {string}  [message]   Message for error responses
 * @param {any[]}   [errors]    Field-level errors
 */
export function sendResponse(res, statusCode, success, data = null, message = "", errors = []) {
  if (success) {
    return res.status(statusCode).json({ success: true, data });
  }
  return res.status(statusCode).json({ success: false, message, errors });
}
