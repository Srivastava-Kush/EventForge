import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { computeMetrics } from "./eventMetrics.service.js";

/**
 * Generic helper to locate the index of an item in any embedded subdocument array.
 * Throws AppError 404 if item does not exist.
 *
 * @param {object} event - Mongoose event document
 * @param {string} collection - Array property name (e.g. "tasks", "vendors")
 * @param {string} itemId - Target subdocument ID
 * @param {string} entityName - Human-readable label for error reporting
 * @returns {number} Index in array
 */
export function findSubEntityIndex(event, collection, itemId, entityName) {
  const items = event[collection] || [];
  const index = items.findIndex((item) => item.id === itemId);
  if (index === -1) {
    throw new AppError(`${entityName} not found.`, HTTP_STATUS.NOT_FOUND);
  }
  return index;
}

/**
 * Generic helper to remove a subdocument from an event by ID and recompute metrics.
 *
 * @param {object} event - Mongoose event document
 * @param {string} collection - Array property name
 * @param {string} itemId - Target subdocument ID
 * @returns {Promise<{ metrics: object }>}
 */
export async function removeSubEntity(event, collection, itemId) {
  event[collection] = (event[collection] || []).filter((item) => item.id !== itemId);
  await event.save();
  return { metrics: computeMetrics(event) };
}
