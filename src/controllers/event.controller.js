import * as eventService from "../services/event.service.js";
import * as taskService from "../services/task.service.js";
import * as vendorService from "../services/vendor.service.js";
import * as expenseService from "../services/expense.service.js";
import * as guestService from "../services/guest.service.js";
import * as scheduleService from "../services/schedule.service.js";
import * as posterService from "../services/poster.service.js";
import { sendResponse } from "../utils/sendResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/** POST /api/events — create, save and return a full plan */
export async function createEvent(req, res) {
  const { plan, ideas, event } = await eventService.createEvent(req.body, {
    user: req.user,
    now: new Date(),
  });
  return sendResponse(res, HTTP_STATUS.CREATED, true, {
    plan,
    ...plan,
    ideas,
    eventId: event?._id ?? null,
  });
}

/** GET /api/events — list user's events with computed progress metrics */
export async function listEvents(req, res) {
  const events = await eventService.getUserEvents(req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, events);
}

/** GET /api/events/:id — single event detail with live metrics */
export async function getEvent(req, res) {
  const event = await eventService.getEventById(req.params.id, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, event);
}

/** DELETE /api/events/:id */
export async function deleteEvent(req, res) {
  await eventService.deleteEvent(req.params.id, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, null, "Event deleted.");
}

/* ==========================================================================
   TASK CONTROLLERS (Delegated directly to task.service.js)
   ========================================================================== */

export async function createTask(req, res) {
  const result = await taskService.createTask(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateTask(req, res) {
  const result = await taskService.updateTask(req.params.id, req.params.taskId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteTask(req, res) {
  const result = await taskService.deleteTask(req.params.id, req.params.taskId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   VENDOR CONTROLLERS (Delegated directly to vendor.service.js)
   ========================================================================== */

export async function createVendor(req, res) {
  const result = await vendorService.createVendor(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateVendor(req, res) {
  const result = await vendorService.updateVendor(req.params.id, req.params.vendorId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteVendor(req, res) {
  const result = await vendorService.deleteVendor(req.params.id, req.params.vendorId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   EXPENSE CONTROLLERS (Delegated directly to expense.service.js)
   ========================================================================== */

export async function createExpense(req, res) {
  const result = await expenseService.createExpense(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateExpense(req, res) {
  const result = await expenseService.updateExpense(req.params.id, req.params.expenseId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteExpense(req, res) {
  const result = await expenseService.deleteExpense(req.params.id, req.params.expenseId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   GUEST CONTROLLERS (Delegated directly to guest.service.js)
   ========================================================================== */

export async function createGuest(req, res) {
  const result = await guestService.createGuest(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateGuest(req, res) {
  const result = await guestService.updateGuest(req.params.id, req.params.guestId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteGuest(req, res) {
  const result = await guestService.deleteGuest(req.params.id, req.params.guestId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function importGuests(req, res) {
  const result = await guestService.importGuests(req.params.id, req.body.guests || req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   SCHEDULE CONTROLLERS (Delegated directly to schedule.service.js)
   ========================================================================== */

export async function createScheduleItem(req, res) {
  const result = await scheduleService.createScheduleItem(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateScheduleItem(req, res) {
  const result = await scheduleService.updateScheduleItem(req.params.id, req.params.itemId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteScheduleItem(req, res) {
  const result = await scheduleService.deleteScheduleItem(req.params.id, req.params.itemId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   POSTER STUDIO CONTROLLERS (Delegated directly to poster.service.js)
   ========================================================================== */

export async function getPosterSuggestions(req, res) {
  const suggestions = await posterService.getPosterSuggestions(req.params.id, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, suggestions);
}

export async function generatePoster(req, res) {
  const event = await eventService.getEventById(req.params.id, req.user._id);
  const result = await posterService.generatePosterWithAi({
    title: req.body.title || event.plan?.summary?.eventName || event.input?.eventName,
    subtitle: req.body.subtitle || event.input?.vibe || event.type,
    date: req.body.date || event.plan?.summary?.date || event.input?.date,
    location: req.body.location || event.input?.setting,
    style: req.body.style || "modern",
    prompt: req.body.prompt || "",
    eventType: event.type,
    engine: req.body.engine || "auto",
  });
  return sendResponse(res, HTTP_STATUS.OK, true, {
    type: result.type,
    data: result.data,
    svg: result.type === "svg" ? result.data : null,
    imageUrl: result.type === "image" ? result.data : null,
  });
}

export async function savePoster(req, res) {
  const result = await posterService.savePoster(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function deletePoster(req, res) {
  const result = await posterService.deletePoster(req.params.id, req.params.posterId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function generateEventIdeas(req, res) {
  const result = await eventService.generateEventIdeas(req.params.id, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}
