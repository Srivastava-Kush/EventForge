import { buildPlan } from "../planner/index.js";
import { validatePlanRequest } from "../validators/event.validator.js";
import { createIdeasService } from "./llm.service.js";
import Event from "../models/Event.model.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { getDefaultSchedule, computeMetrics } from "./eventMetrics.service.js";
import { initializeTasksFromPlan } from "./task.service.js";
import { initializeVendorsFromPlan } from "./vendor.service.js";
import { initializeExpensesFromPlan } from "./expense.service.js";

// Shared ideas service instance — replaced via configureEventService()
let _ideasService = null;

/**
 * Configures the event service with a concrete ideas service.
 * @param {{ ideasService: object }} deps
 */
export function configureEventService({ ideasService }) {
  _ideasService = ideasService;
}

function getIdeasService() {
  if (!_ideasService) _ideasService = createIdeasService();
  return _ideasService;
}

/**
 * Initializes interactive sub-entities for an event if not already populated.
 * @param {object} event
 * @returns {boolean} Whether any fields were populated and modified
 */
function ensureInteractiveEntities(event) {
  let modified = false;

  if (!event.tasks || event.tasks.length === 0) {
    event.tasks = initializeTasksFromPlan(event.plan?.timeline?.tasks);
    modified = true;
  }

  if (!event.vendors || event.vendors.length === 0) {
    event.vendors = initializeVendorsFromPlan(event.plan?.vendors);
    modified = true;
  }

  if (!event.expenses || event.expenses.length === 0) {
    event.expenses = initializeExpensesFromPlan(event.plan?.budget?.items);
    modified = true;
  }

  if (!event.schedule || event.schedule.length === 0) {
    event.schedule = getDefaultSchedule(event.type || "wedding");
    modified = true;
  }

  if (!event.guests) {
    event.guests = [];
    modified = true;
  }

  if (!event.posters) {
    event.posters = [];
    modified = true;
  }

  return modified;
}

/**
 * Validates input, runs buildPlan(), calls getIdeas(), and saves the result
 * to MongoDB with fully initialized interactive tasks, vendors, and expenses.
 * @param {object} body
 * @param {{ user?: object, now?: Date }} [options]
 * @returns {Promise<{ plan: object, ideas: object, event: object|null }>}
 */
export async function createEvent(body, { user = null, now = new Date() } = {}) {
  // 1. Validate
  const validation = validatePlanRequest(body, { now });
  if (!validation.success) {
    throw new AppError("Please check the highlighted fields.", HTTP_STATUS.UNPROCESSABLE_ENTITY, validation.errors);
  }

  // 2. Build plan
  const plan = buildPlan(validation.data, { now });

  // 3. Get ideas from LLM (or curated fallback)
  const ideasResult = await getIdeasService().getIdeas(validation.data, plan);

  // 4. Initialize interactive components using sub-service transformers
  const tasks = initializeTasksFromPlan(plan.timeline?.tasks);
  const vendors = initializeVendorsFromPlan(plan.vendors);
  const expenses = initializeExpensesFromPlan(plan.budget?.items);
  const schedule = getDefaultSchedule(validation.data.eventType);

  // 5. Persist if user is authenticated
  let savedEvent = null;
  if (user) {
    savedEvent = await Event.create({
      user: user._id,
      type: validation.data.eventType,
      input: validation.data,
      plan,
      ideas: ideasResult,
      tasks,
      vendors,
      expenses,
      schedule,
      guests: [],
      posters: [],
    });
  }

  return { plan, ideas: ideasResult, event: savedEvent };
}

/**
 * Returns all events for a user with computed dashboard progress metrics.
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @returns {Promise<Array<object>>}
 */
export async function getUserEvents(userId) {
  const events = await Event.find({ user: userId })
    .select("-posters.imageData")
    .sort({ createdAt: -1 });

  return events.map((ev) => {
    ensureInteractiveEntities(ev);
    const metrics = computeMetrics(ev);
    return {
      _id: ev._id,
      type: ev.type,
      input: ev.input,
      plan: {
        summary: ev.plan?.summary || {},
        budget: ev.plan?.budget || {},
      },
      metrics,
      createdAt: ev.createdAt,
      updatedAt: ev.updatedAt,
    };
  });
}

/**
 * Fetches an event by ID and verifies user ownership.
 * Ensures all interactive entity arrays (tasks, vendors, expenses, etc.) are initialized.
 * Throws AppError 404 if not found or unauthorized.
 *
 * @param {string} eventId
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @param {{ autoSave?: boolean }} [options]
 * @returns {Promise<import("mongoose").Document>}
 */
export async function getOwnedEvent(eventId, userId, { autoSave = false } = {}) {
  const event = await Event.findOne({ _id: eventId, user: userId });
  if (!event) throw new AppError("Event not found.", HTTP_STATUS.NOT_FOUND);
  const modified = ensureInteractiveEntities(event);
  if (autoSave && modified) {
    await event.save();
  }
  return event;
}

/**
 * Returns a single event by ID, enforcing ownership and attaching live metrics.
 * @param {string} eventId
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @returns {Promise<object>}
 */
export async function getEventById(eventId, userId) {
  const event = await getOwnedEvent(eventId, userId, { autoSave: true });
  const metrics = computeMetrics(event);
  const plain = event.toObject();
  plain.metrics = metrics;
  return plain;
}

/**
 * Deletes an event by ID, enforcing ownership.
 * @param {string} eventId
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @returns {Promise<object>}
 */
export async function deleteEvent(eventId, userId) {
  const event = await Event.findOneAndDelete({ _id: eventId, user: userId });
  if (!event) throw new AppError("Event not found.", HTTP_STATUS.NOT_FOUND);
  return event;
}

/**
 * Generates or regenerates personalized AI inspirations & creative themes for an event.
 * @param {string} eventId
 * @param {string|import("mongoose").Types.ObjectId} userId
 * @returns {Promise<{ ideas: object }>}
 */
export async function generateEventIdeas(eventId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  const ideasResult = await getIdeasService().getIdeas(event.input, event.plan);
  event.ideas = ideasResult;
  await event.save();
  return { ideas: ideasResult };
}