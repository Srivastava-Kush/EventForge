import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { computeMetrics } from "./eventMetrics.service.js";
import { findSubEntityIndex, removeSubEntity } from "./subdocument.utils.js";
import { getOwnedEvent } from "./event.service.js";

export const GUEST_LIMITS = Object.freeze({
  MAX_IMPORT_BATCH: 500,
  MAX_EVENT_TOTAL: 5000,
  MAX_PLUS_ONES: 20,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 150,
  MAX_PHONE_LENGTH: 30,
  MAX_TEXT_LENGTH: 500,
});

/**
 * Creates an individual guest subdocument under the target event.
 * @param {string} eventId
 * @param {object} guestData
 * @param {string} userId
 * @returns {Promise<{ guest: object, metrics: object }>}
 */
export async function createGuest(eventId, guestData, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!guestData.name?.trim()) {
    throw new AppError("Guest name is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const newGuest = {
    id: `guest-${randomUUID().slice(0, 8)}`,
    name: guestData.name.trim(),
    email: guestData.email?.trim() || "",
    phone: guestData.phone?.trim() || "",
    group: guestData.group || "General",
    invitationStatus: guestData.invitationStatus || "not_sent",
    rsvpStatus: guestData.rsvpStatus || "pending",
    plusOnes: Number(guestData.plusOnes) || 0,
    plusOneNames: guestData.plusOneNames || "",
    dietary: guestData.dietary || "",
    tableOrSeating: guestData.tableOrSeating || "",
    notes: guestData.notes || "",
    updatedAt: new Date(),
  };

  event.guests.push(newGuest);
  await event.save();
  return { guest: newGuest, metrics: computeMetrics(event) };
}

/**
 * Updates an existing guest subdocument.
 * @param {string} eventId
 * @param {string} guestId
 * @param {object} updates
 * @param {string} userId
 * @returns {Promise<{ guest: object, metrics: object }>}
 */
export async function updateGuest(eventId, guestId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);
  const guestIndex = findSubEntityIndex(event, "guests", guestId, "Guest");

  const current = event.guests[guestIndex];
  if (updates.name !== undefined) current.name = updates.name.trim();
  if (updates.email !== undefined) current.email = updates.email.trim();
  if (updates.phone !== undefined) current.phone = updates.phone.trim();
  if (updates.group !== undefined) current.group = updates.group;
  if (updates.invitationStatus !== undefined) current.invitationStatus = updates.invitationStatus;
  if (updates.rsvpStatus !== undefined) current.rsvpStatus = updates.rsvpStatus;
  if (updates.plusOnes !== undefined) current.plusOnes = Number(updates.plusOnes) || 0;
  if (updates.plusOneNames !== undefined) current.plusOneNames = updates.plusOneNames;
  if (updates.dietary !== undefined) current.dietary = updates.dietary;
  if (updates.tableOrSeating !== undefined) current.tableOrSeating = updates.tableOrSeating;
  if (updates.notes !== undefined) current.notes = updates.notes;
  current.updatedAt = new Date();

  event.guests[guestIndex] = current;
  await event.save();
  return { guest: current, metrics: computeMetrics(event) };
}

/**
 * Deletes a guest subdocument from the target event.
 * @param {string} eventId
 * @param {string} guestId
 * @param {string} userId
 * @returns {Promise<{ metrics: object }>}
 */
export async function deleteGuest(eventId, guestId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return removeSubEntity(event, "guests", guestId);
}

/**
 * Bulk imports an array of guests with limits enforcement.
 * @param {string} eventId
 * @param {Array<object>} guestsList
 * @param {string} userId
 * @returns {Promise<{ addedCount: number, guests: Array<object>, metrics: object }>}
 */
export async function importGuests(eventId, guestsList, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!Array.isArray(guestsList) || guestsList.length === 0) {
    throw new AppError("Guest list must be a non-empty array.", HTTP_STATUS.BAD_REQUEST);
  }

  if (guestsList.length > GUEST_LIMITS.MAX_IMPORT_BATCH) {
    throw new AppError(`Cannot import more than ${GUEST_LIMITS.MAX_IMPORT_BATCH} guests in a single request.`, HTTP_STATUS.BAD_REQUEST);
  }

  if ((event.guests?.length || 0) + guestsList.length > GUEST_LIMITS.MAX_EVENT_TOTAL) {
    throw new AppError(`Event guest list cannot exceed ${GUEST_LIMITS.MAX_EVENT_TOTAL} guests.`, HTTP_STATUS.BAD_REQUEST);
  }

  const validNewGuests = [];
  for (const item of guestsList) {
    if (!item || typeof item !== "object") continue;
    const name = item.name ? String(item.name).trim().slice(0, GUEST_LIMITS.MAX_NAME_LENGTH) : "";
    if (!name) continue;

    validNewGuests.push({
      id: `guest-${randomUUID().slice(0, 8)}`,
      name,
      email: item.email ? String(item.email).trim().slice(0, GUEST_LIMITS.MAX_EMAIL_LENGTH) : "",
      phone: item.phone ? String(item.phone).trim().slice(0, GUEST_LIMITS.MAX_PHONE_LENGTH) : "",
      group: item.group ? String(item.group).trim().slice(0, 50) : "General",
      invitationStatus: ["not_sent", "sent", "opened"].includes(item.invitationStatus) ? item.invitationStatus : "not_sent",
      rsvpStatus: ["pending", "attending", "declined", "tentative"].includes(item.rsvpStatus) ? item.rsvpStatus : "pending",
      plusOnes: Math.min(GUEST_LIMITS.MAX_PLUS_ONES, Math.max(0, parseInt(item.plusOnes, 10) || 0)),
      plusOneNames: item.plusOneNames ? String(item.plusOneNames).trim().slice(0, 200) : "",
      dietary: item.dietary ? String(item.dietary).trim().slice(0, 200) : "",
      tableOrSeating: item.tableOrSeating ? String(item.tableOrSeating).trim().slice(0, 50) : "",
      notes: item.notes ? String(item.notes).trim().slice(0, GUEST_LIMITS.MAX_TEXT_LENGTH) : "",
      updatedAt: new Date(),
    });
  }

  event.guests.push(...validNewGuests);
  await event.save();
  return { addedCount: validNewGuests.length, guests: event.guests, metrics: computeMetrics(event) };
}
