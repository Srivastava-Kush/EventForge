import { randomUUID } from "node:crypto";
import { buildPlan } from "../planner/index.js";
import { validatePlanRequest } from "../validators/event.validator.js";
import { createIdeasService } from "./llm.service.js";
import Event from "../models/Event.model.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { getDefaultSchedule, computeMetrics } from "./eventMetrics.service.js";
import {
  buildPosterSuggestions,
  generateSvgPoster,
  generatePosterWithAi,
  savePosterToEvent,
  deletePosterFromEvent,
} from "./poster.service.js";

// Re-export metrics & poster functions for full backwards compatibility
export { getDefaultSchedule, computeMetrics, generateSvgPoster, generatePosterWithAi };

// Shared ideas service instance — no client by default; replaced in configureEventService()
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
 */
function ensureInteractiveEntities(event) {
  let modified = false;

  if (!event.tasks || event.tasks.length === 0) {
    const planTasks = event.plan?.timeline?.tasks || [];
    event.tasks = planTasks.map((t) => ({
      id: t.id || `task-${randomUUID().slice(0, 8)}`,
      title: t.title,
      phase: t.phase || "Plan & book",
      dueDate: t.dueDate || "",
      urgent: Boolean(t.urgent),
      status: "pending",
      notes: "",
      assignedTo: "",
      isCustom: false,
    }));
    modified = true;
  }

  if (!event.vendors || event.vendors.length === 0) {
    const planVendors = event.plan?.vendors || [];
    event.vendors = planVendors.map((v) => ({
      id: v.id || `vendor-${randomUUID().slice(0, 8)}`,
      name: v.name,
      priority: v.priority || "essential",
      matchesPriority: Boolean(v.matchesPriority),
      bookBy: v.bookBy || "",
      bookNow: Boolean(v.bookNow),
      tip: v.tip || "",
      bookingStatus: "pending",
      vendorName: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      quotationAmount: 0,
      agreedAmount: 0,
      paidAmount: 0,
      notes: "",
      documents: [],
    }));
    modified = true;
  }

  if (!event.expenses || event.expenses.length === 0) {
    const budgetItems = event.plan?.budget?.items || [];
    event.expenses = budgetItems.map((b) => ({
      id: `exp-${b.key || randomUUID().slice(0, 8)}`,
      title: b.label,
      category: b.label,
      estimatedCost: Number(b.amount) || 0,
      actualCost: 0,
      paidAmount: 0,
      status: "unpaid",
      dueDate: "",
      paidDate: "",
      linkedVendorId: null,
      linkedTaskId: null,
      notes: "",
      createdAt: new Date(),
    }));
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

  // 4. Initialize interactive components
  const tasks = (plan.timeline?.tasks || []).map((t) => ({
    id: t.id || `task-${randomUUID().slice(0, 8)}`,
    title: t.title,
    phase: t.phase || "Plan & book",
    dueDate: t.dueDate || "",
    urgent: Boolean(t.urgent),
    status: "pending",
    notes: "",
    assignedTo: "",
    isCustom: false,
  }));

  const vendors = (plan.vendors || []).map((v) => ({
    id: v.id || `vendor-${randomUUID().slice(0, 8)}`,
    name: v.name,
    priority: v.priority || "essential",
    matchesPriority: Boolean(v.matchesPriority),
    bookBy: v.bookBy || "",
    bookNow: Boolean(v.bookNow),
    tip: v.tip || "",
    bookingStatus: "pending",
    vendorName: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    quotationAmount: 0,
    agreedAmount: 0,
    paidAmount: 0,
    notes: "",
    documents: [],
  }));

  const expenses = (plan.budget?.items || []).map((b) => ({
    id: `exp-${b.key || randomUUID().slice(0, 8)}`,
    title: b.label,
    category: b.label,
    estimatedCost: Number(b.amount) || 0,
    actualCost: 0,
    paidAmount: 0,
    status: "unpaid",
    dueDate: "",
    paidDate: "",
    linkedVendorId: null,
    linkedTaskId: null,
    notes: "",
    createdAt: new Date(),
  }));

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
 */
export async function deleteEvent(eventId, userId) {
  const event = await Event.findOneAndDelete({ _id: eventId, user: userId });
  if (!event) throw new AppError("Event not found.", HTTP_STATUS.NOT_FOUND);
  return event;
}

/* ==========================================================================
   TASK MANAGEMENT OPERATIONS (Separate from vendor booking status)
   ========================================================================== */

export async function createTask(eventId, taskData, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!taskData.title?.trim()) {
    throw new AppError("Task title is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const newTask = {
    id: `task-custom-${randomUUID().slice(0, 8)}`,
    title: taskData.title.trim(),
    phase: taskData.phase || "Plan & book",
    dueDate: taskData.dueDate || "",
    urgent: Boolean(taskData.urgent),
    status: taskData.status === "completed" ? "completed" : "pending",
    completedAt: taskData.status === "completed" ? new Date() : null,
    notes: taskData.notes || "",
    assignedTo: taskData.assignedTo || "",
    isCustom: true,
  };

  event.tasks.push(newTask);
  await event.save();
  return { task: newTask, metrics: computeMetrics(event) };
}

export async function updateTask(eventId, taskId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const taskIndex = event.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) throw new AppError("Task not found.", HTTP_STATUS.NOT_FOUND);

  const current = event.tasks[taskIndex];
  if (updates.status !== undefined) {
    current.status = updates.status === "completed" ? "completed" : "pending";
    current.completedAt = current.status === "completed" ? new Date() : null;
  }
  if (updates.title !== undefined) current.title = updates.title.trim();
  if (updates.phase !== undefined) current.phase = updates.phase;
  if (updates.dueDate !== undefined) current.dueDate = updates.dueDate;
  if (updates.urgent !== undefined) current.urgent = Boolean(updates.urgent);
  if (updates.notes !== undefined) current.notes = updates.notes;
  if (updates.assignedTo !== undefined) current.assignedTo = updates.assignedTo;

  event.tasks[taskIndex] = current;
  await event.save();
  return { task: current, metrics: computeMetrics(event) };
}

export async function deleteTask(eventId, taskId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  event.tasks = event.tasks.filter((t) => t.id !== taskId);
  await event.save();
  return { metrics: computeMetrics(event) };
}

/* ==========================================================================
   VENDOR MANAGEMENT OPERATIONS (Separate from task status)
   ========================================================================== */

export async function createVendor(eventId, vendorData, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!vendorData.name?.trim()) {
    throw new AppError("Vendor category name is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const newVendor = {
    id: `vendor-custom-${randomUUID().slice(0, 8)}`,
    name: vendorData.name.trim(),
    priority: vendorData.priority || "recommended",
    matchesPriority: false,
    bookBy: vendorData.bookBy || "",
    bookNow: Boolean(vendorData.bookNow),
    tip: vendorData.tip || "",
    bookingStatus: vendorData.bookingStatus || "pending",
    vendorName: vendorData.vendorName || "",
    contactPerson: vendorData.contactPerson || "",
    contactEmail: vendorData.contactEmail || "",
    contactPhone: vendorData.contactPhone || "",
    quotationAmount: Number(vendorData.quotationAmount) || 0,
    agreedAmount: Number(vendorData.agreedAmount) || 0,
    paidAmount: Number(vendorData.paidAmount) || 0,
    notes: vendorData.notes || "",
    documents: vendorData.documents || [],
  };

  event.vendors.push(newVendor);
  await event.save();
  return { vendor: newVendor, metrics: computeMetrics(event) };
}

export async function updateVendor(eventId, vendorId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const vendorIndex = event.vendors.findIndex((v) => v.id === vendorId);
  if (vendorIndex === -1) throw new AppError("Vendor not found.", HTTP_STATUS.NOT_FOUND);

  const current = event.vendors[vendorIndex];
  if (updates.bookingStatus !== undefined) current.bookingStatus = updates.bookingStatus;
  if (updates.vendorName !== undefined) current.vendorName = updates.vendorName;
  if (updates.contactPerson !== undefined) current.contactPerson = updates.contactPerson;
  if (updates.contactEmail !== undefined) current.contactEmail = updates.contactEmail;
  if (updates.contactPhone !== undefined) current.contactPhone = updates.contactPhone;
  if (updates.quotationAmount !== undefined) current.quotationAmount = Number(updates.quotationAmount) || 0;
  if (updates.agreedAmount !== undefined) current.agreedAmount = Number(updates.agreedAmount) || 0;
  if (updates.paidAmount !== undefined) current.paidAmount = Number(updates.paidAmount) || 0;
  if (updates.notes !== undefined) current.notes = updates.notes;
  if (updates.bookBy !== undefined) current.bookBy = updates.bookBy;
  if (updates.priority !== undefined) current.priority = updates.priority;
  if (updates.documents !== undefined) current.documents = updates.documents;

  event.vendors[vendorIndex] = current;
  await event.save();
  return { vendor: current, metrics: computeMetrics(event) };
}

export async function deleteVendor(eventId, vendorId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  event.vendors = event.vendors.filter((v) => v.id !== vendorId);
  await event.save();
  return { metrics: computeMetrics(event) };
}

/* ==========================================================================
   INDIVIDUAL EXPENSES & BUDGET (Strictly 1:1, prevents double counting)
   ========================================================================== */

export async function createExpense(eventId, expenseData, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!expenseData.title?.trim()) {
    throw new AppError("Expense title is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const actualCost = Number(expenseData.actualCost) || 0;
  const paidAmount = Number(expenseData.paidAmount) || 0;
  let status = expenseData.status || "unpaid";
  if (paidAmount >= actualCost && actualCost > 0) status = "paid";
  else if (paidAmount > 0) status = "partially_paid";

  const newExpense = {
    id: `exp-${randomUUID().slice(0, 8)}`,
    title: expenseData.title.trim(),
    category: expenseData.category || "General",
    estimatedCost: Number(expenseData.estimatedCost) || 0,
    actualCost,
    paidAmount,
    status,
    dueDate: expenseData.dueDate || "",
    paidDate: expenseData.paidDate || "",
    linkedVendorId: expenseData.linkedVendorId || null,
    linkedTaskId: expenseData.linkedTaskId || null,
    notes: expenseData.notes || "",
    createdAt: new Date(),
  };

  event.expenses.push(newExpense);
  await event.save();
  return { expense: newExpense, metrics: computeMetrics(event) };
}

export async function updateExpense(eventId, expenseId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const expIndex = event.expenses.findIndex((e) => e.id === expenseId);
  if (expIndex === -1) throw new AppError("Expense not found.", HTTP_STATUS.NOT_FOUND);

  const current = event.expenses[expIndex];
  if (updates.title !== undefined) current.title = updates.title.trim();
  if (updates.category !== undefined) current.category = updates.category;
  if (updates.estimatedCost !== undefined) current.estimatedCost = Number(updates.estimatedCost) || 0;
  if (updates.actualCost !== undefined) current.actualCost = Number(updates.actualCost) || 0;
  if (updates.paidAmount !== undefined) current.paidAmount = Number(updates.paidAmount) || 0;
  if (updates.dueDate !== undefined) current.dueDate = updates.dueDate;
  if (updates.paidDate !== undefined) current.paidDate = updates.paidDate;
  if (updates.linkedVendorId !== undefined) current.linkedVendorId = updates.linkedVendorId;
  if (updates.linkedTaskId !== undefined) current.linkedTaskId = updates.linkedTaskId;
  if (updates.notes !== undefined) current.notes = updates.notes;

  if (updates.status !== undefined) {
    current.status = updates.status;
  } else {
    if (current.paidAmount >= current.actualCost && current.actualCost > 0) current.status = "paid";
    else if (current.paidAmount > 0) current.status = "partially_paid";
    else current.status = "unpaid";
  }

  event.expenses[expIndex] = current;
  await event.save();
  return { expense: current, metrics: computeMetrics(event) };
}

export async function deleteExpense(eventId, expenseId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  event.expenses = event.expenses.filter((e) => e.id !== expenseId);
  await event.save();
  return { metrics: computeMetrics(event) };
}

/* ==========================================================================
   GUEST MANAGEMENT OPERATIONS (RSVP, Plus-Ones, CSV Import)
   ========================================================================== */

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

export async function updateGuest(eventId, guestId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const guestIndex = event.guests.findIndex((g) => g.id === guestId);
  if (guestIndex === -1) throw new AppError("Guest not found.", HTTP_STATUS.NOT_FOUND);

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

export async function deleteGuest(eventId, guestId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  event.guests = event.guests.filter((g) => g.id !== guestId);
  await event.save();
  return { metrics: computeMetrics(event) };
}

export async function importGuests(eventId, guestsList, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!Array.isArray(guestsList) || guestsList.length === 0) {
    throw new AppError("Guest list must be a non-empty array.", HTTP_STATUS.BAD_REQUEST);
  }

  if (guestsList.length > 500) {
    throw new AppError("Cannot import more than 500 guests in a single request.", HTTP_STATUS.BAD_REQUEST);
  }

  if ((event.guests?.length || 0) + guestsList.length > 5000) {
    throw new AppError("Event guest list cannot exceed 5000 guests.", HTTP_STATUS.BAD_REQUEST);
  }

  const validNewGuests = [];
  for (const item of guestsList) {
    if (!item || typeof item !== "object") continue;
    const name = item.name ? String(item.name).trim().slice(0, 100) : "";
    if (!name) continue;

    validNewGuests.push({
      id: `guest-${randomUUID().slice(0, 8)}`,
      name,
      email: item.email ? String(item.email).trim().slice(0, 150) : "",
      phone: item.phone ? String(item.phone).trim().slice(0, 30) : "",
      group: item.group ? String(item.group).trim().slice(0, 50) : "General",
      invitationStatus: ["not_sent", "sent", "opened"].includes(item.invitationStatus) ? item.invitationStatus : "not_sent",
      rsvpStatus: ["pending", "attending", "declined", "tentative"].includes(item.rsvpStatus) ? item.rsvpStatus : "pending",
      plusOnes: Math.min(20, Math.max(0, parseInt(item.plusOnes, 10) || 0)),
      plusOneNames: item.plusOneNames ? String(item.plusOneNames).trim().slice(0, 200) : "",
      dietary: item.dietary ? String(item.dietary).trim().slice(0, 200) : "",
      tableOrSeating: item.tableOrSeating ? String(item.tableOrSeating).trim().slice(0, 50) : "",
      notes: item.notes ? String(item.notes).trim().slice(0, 500) : "",
      updatedAt: new Date(),
    });
  }

  event.guests.push(...validNewGuests);
  await event.save();
  return { addedCount: validNewGuests.length, guests: event.guests, metrics: computeMetrics(event) };
}

/* ==========================================================================
   SCHEDULE / DAY-OF RUN SHEET OPERATIONS
   ========================================================================== */

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

export async function updateScheduleItem(eventId, itemId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const idx = event.schedule.findIndex((s) => s.id === itemId);
  if (idx === -1) throw new AppError("Schedule item not found.", HTTP_STATUS.NOT_FOUND);

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

export async function deleteScheduleItem(eventId, itemId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  event.schedule = event.schedule.filter((s) => s.id !== itemId);
  await event.save();
  return { metrics: computeMetrics(event) };
}

/* ==========================================================================
   AI POSTER STUDIO OPERATIONS (Delegated to poster.service.js)
   ========================================================================== */

/**
 * Returns suggested poster styles and prompts tailored to the specific event.
 */
export async function getPosterSuggestions(eventId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return buildPosterSuggestions(event);
}

export async function savePoster(eventId, posterData, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return savePosterToEvent(event, posterData);
}

export async function deletePoster(eventId, posterId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return deletePosterFromEvent(event, posterId);
}

/**
 * Generates or regenerates personalized AI inspirations & creative themes for an event.
 */
export async function generateEventIdeas(eventId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const ideasResult = await getIdeasService().getIdeas(event.input, event.plan);
  event.ideas = ideasResult;
  await event.save();
  return { ideas: ideasResult };
}


