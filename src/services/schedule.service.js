import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { computeMetrics } from "./eventMetrics.service.js";
import { findSubEntityIndex, removeSubEntity } from "./subdocument.utils.js";
import { getOwnedEvent } from "./event.service.js";

/**
 * Creates a schedule run-sheet item under the target event.
 * @param {string} eventId
 * @param {object} itemData
 * @param {string} userId
 * @returns {Promise<{ item: object, metrics: object }>}
 */
export async function createScheduleItem(eventId, itemData, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!itemData.startTime?.trim() || !itemData.activity?.trim()) {
    throw new AppError("Start time and activity are required.", HTTP_STATUS.BAD_REQUEST);
  }

  const newItem = {
    id: `sch-${randomUUID().slice(0, 8)}`,
    startTime: itemData.startTime.trim(),
    endTime: itemData.endTime?.trim() || "",
    activity: itemData.activity.trim(),
    location: itemData.location?.trim() || "",
    responsiblePerson: itemData.responsiblePerson?.trim() || "",
    relatedVendorId: itemData.relatedVendorId || null,
    notes: itemData.notes || "",
    completed: Boolean(itemData.completed),
  };

  event.schedule.push(newItem);
  await event.save();
  return { item: newItem, metrics: computeMetrics(event) };
}

/**
 * Updates an existing schedule run-sheet item.
 * @param {string} eventId
 * @param {string} itemId
 * @param {object} updates
 * @param {string} userId
 * @returns {Promise<{ item: object, metrics: object }>}
 */
export async function updateScheduleItem(eventId, itemId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);
  const idx = findSubEntityIndex(event, "schedule", itemId, "Schedule item");

  const current = event.schedule[idx];
  if (updates.startTime !== undefined) current.startTime = updates.startTime.trim();
  if (updates.endTime !== undefined) current.endTime = updates.endTime.trim();
  if (updates.activity !== undefined) current.activity = updates.activity.trim();
  if (updates.location !== undefined) current.location = updates.location.trim();
  if (updates.responsiblePerson !== undefined) current.responsiblePerson = updates.responsiblePerson.trim();
  if (updates.relatedVendorId !== undefined) current.relatedVendorId = updates.relatedVendorId;
  if (updates.notes !== undefined) current.notes = updates.notes;
  if (updates.completed !== undefined) current.completed = Boolean(updates.completed);

  event.schedule[idx] = current;
  await event.save();
  return { item: current, metrics: computeMetrics(event) };
}

/**
 * Deletes a schedule run-sheet item from the target event.
 * @param {string} eventId
 * @param {string} itemId
 * @param {string} userId
 * @returns {Promise<{ metrics: object }>}
 */
export async function deleteScheduleItem(eventId, itemId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return removeSubEntity(event, "schedule", itemId);
}
