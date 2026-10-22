import * as eventService from "../services/event.service.js";
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
   TASK CONTROLLERS
   ========================================================================== */

export async function createTask(req, res) {
  const result = await eventService.createTask(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateTask(req, res) {
  const result = await eventService.updateTask(req.params.id, req.params.taskId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteTask(req, res) {
  const result = await eventService.deleteTask(req.params.id, req.params.taskId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   VENDOR CONTROLLERS
   ========================================================================== */

export async function createVendor(req, res) {
  const result = await eventService.createVendor(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateVendor(req, res) {
  const result = await eventService.updateVendor(req.params.id, req.params.vendorId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteVendor(req, res) {
  const result = await eventService.deleteVendor(req.params.id, req.params.vendorId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   EXPENSE CONTROLLERS
   ========================================================================== */

export async function createExpense(req, res) {
  const result = await eventService.createExpense(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateExpense(req, res) {
  const result = await eventService.updateExpense(req.params.id, req.params.expenseId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteExpense(req, res) {
  const result = await eventService.deleteExpense(req.params.id, req.params.expenseId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   GUEST CONTROLLERS
   ========================================================================== */

export async function createGuest(req, res) {
  const result = await eventService.createGuest(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateGuest(req, res) {
  const result = await eventService.updateGuest(req.params.id, req.params.guestId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteGuest(req, res) {
  const result = await eventService.deleteGuest(req.params.id, req.params.guestId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function importGuests(req, res) {
  const result = await eventService.importGuests(req.params.id, req.body.guests || req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   SCHEDULE CONTROLLERS
   ========================================================================== */

export async function createScheduleItem(req, res) {
  const result = await eventService.createScheduleItem(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function updateScheduleItem(req, res) {
  const result = await eventService.updateScheduleItem(req.params.id, req.params.itemId, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function deleteScheduleItem(req, res) {
  const result = await eventService.deleteScheduleItem(req.params.id, req.params.itemId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

/* ==========================================================================
   POSTER STUDIO CONTROLLERS
   ========================================================================== */

export async function getPosterSuggestions(req, res) {
  const suggestions = await eventService.getPosterSuggestions(req.params.id, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, suggestions);
}

export async function generatePoster(req, res) {
  const event = await eventService.getEventById(req.params.id, req.user._id);
  const result = await eventService.generatePosterWithAi({
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
  const result = await eventService.savePoster(req.params.id, req.body, req.user._id);
  return sendResponse(res, HTTP_STATUS.CREATED, true, result);
}

export async function deletePoster(req, res) {
  const result = await eventService.deletePoster(req.params.id, req.params.posterId, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

export async function generateEventIdeas(req, res) {
  const result = await eventService.generateEventIdeas(req.params.id, req.user._id);
  return sendResponse(res, HTTP_STATUS.OK, true, result);
}

