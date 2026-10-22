import { randomUUID } from "node:crypto";
import { buildPlan } from "../planner/index.js";
import { validatePlanRequest } from "../validators/event.validator.js";
import { createIdeasService, generatePosterWithGemini } from "./llm.service.js";
import Event from "../models/Event.model.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { sanitizeSvg } from "../utils/sanitizeSvg.js";

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

/** Default sample run-sheet activities by event type */
function getDefaultSchedule(eventType) {
  if (eventType === "wedding") {
    return [
      { id: "sch-1", startTime: "10:00 AM", endTime: "12:00 PM", activity: "Bridal Party & Groom Preparation", location: "Dressing Suites", responsiblePerson: "Wedding Coordinator", notes: "Hair and makeup arrival", completed: false },
      { id: "sch-2", startTime: "01:00 PM", endTime: "02:00 PM", activity: "First Look & Couple Portraits", location: "Main Gardens", responsiblePerson: "Photographer", notes: "Prepare floral bouquets", completed: false },
      { id: "sch-3", startTime: "03:00 PM", endTime: "04:00 PM", activity: "Guest Arrival & Welcome Refreshments", location: "Foyer / Lawn", responsiblePerson: "Usher Team", notes: "Ambient acoustic music", completed: false },
      { id: "sch-4", startTime: "04:00 PM", endTime: "04:45 PM", activity: "Ceremony & Exchange of Vows", location: "Ceremony Arch", responsiblePerson: "Officiant", notes: "Microphone check 30m prior", completed: false },
      { id: "sch-5", startTime: "05:00 PM", endTime: "06:30 PM", activity: "Cocktail Hour & Passed Hors d'oeuvres", location: "Terrace Bar", responsiblePerson: "Catering Lead", notes: "Signature mocktails/drinks", completed: false },
      { id: "sch-6", startTime: "06:30 PM", endTime: "08:30 PM", activity: "Grand Entrance, Toasts & Dinner Service", location: "Ballroom", responsiblePerson: "Maid of Honor / Best Man", notes: "Toasts capped at 3m each", completed: false },
      { id: "sch-7", startTime: "08:30 PM", endTime: "11:00 PM", activity: "Cake Cutting, First Dance & Party", location: "Dance Floor", responsiblePerson: "DJ / Band", notes: "Lighting transition", completed: false },
    ];
  }
  if (eventType === "birthday") {
    return [
      { id: "sch-1", startTime: "02:00 PM", endTime: "03:00 PM", activity: "Venue Setup & Decor Styling", location: "Party Space", responsiblePerson: "Host & Decorator", notes: "Balloons and backdrop", completed: false },
      { id: "sch-2", startTime: "03:30 PM", endTime: "04:00 PM", activity: "Guest Arrival & Welcome Drinks", location: "Entrance / Lounge", responsiblePerson: "Host", notes: "Sign-in guestbook", completed: false },
      { id: "sch-3", startTime: "04:00 PM", endTime: "05:30 PM", activity: "Interactive Games & Activities", location: "Main Hall / Yard", responsiblePerson: "Activity Host", notes: "Music playlist ready", completed: false },
      { id: "sch-4", startTime: "05:30 PM", endTime: "06:45 PM", activity: "Buffet Dinner / Food Service", location: "Dining Area", responsiblePerson: "Caterer", notes: "Dietary tags labeled", completed: false },
      { id: "sch-5", startTime: "06:45 PM", endTime: "07:15 PM", activity: "Cake Cutting & Birthday Toast", location: "Center Stage", responsiblePerson: "Honoree & Family", notes: "Candles and lighter ready", completed: false },
      { id: "sch-6", startTime: "07:15 PM", endTime: "09:00 PM", activity: "Open Dance Floor & Dessert Bar", location: "Dance Floor", responsiblePerson: "DJ", notes: "Party favors distributed", completed: false },
    ];
  }
  return [
    { id: "sch-1", startTime: "08:00 AM", endTime: "09:30 AM", activity: "Logistics Setup & Safety Inspection", location: "Event Grounds", responsiblePerson: "Logistics Lead", notes: "Tables, tents & power supply", completed: false },
    { id: "sch-2", startTime: "09:30 AM", endTime: "10:00 AM", activity: "Volunteer & Staff Briefing", location: "Information Desk", responsiblePerson: "Event Director", notes: "Handout walkie-talkies", completed: false },
    { id: "sch-3", startTime: "10:00 AM", endTime: "10:30 AM", activity: "Gates Open & Welcome Speech", location: "Main Stage", responsiblePerson: "Community Chair", notes: "PA system check", completed: false },
    { id: "sch-4", startTime: "10:30 AM", endTime: "01:00 PM", activity: "Workshops, Stalls & Performances", location: "Activity Zones", responsiblePerson: "Zone Coordinators", notes: "Rotate safety staff", completed: false },
    { id: "sch-5", startTime: "01:00 PM", endTime: "02:30 PM", activity: "Community Feast & Music", location: "Dining Tents", responsiblePerson: "Food Vendors", notes: "Recycling stations active", completed: false },
    { id: "sch-6", startTime: "03:00 PM", endTime: "04:00 PM", activity: "Closing Remarks & Awards", location: "Main Stage", responsiblePerson: "Organizing Committee", notes: "Trophy presentations", completed: false },
    { id: "sch-7", startTime: "04:00 PM", endTime: "06:00 PM", activity: "Teardown, Clean-up & Waste Audit", location: "Entire Grounds", responsiblePerson: "Clean-up Volunteers", notes: "Leave-no-trace check", completed: false },
  ];
}

/**
 * Computes live derived progress metrics for an event without mutating data.
 * Guarantees no double counting: expenses are summed strictly from the expenses list.
 */
export function computeMetrics(event) {
  const tasks = event.tasks || [];
  const vendors = event.vendors || [];
  const expenses = event.expenses || [];
  const guests = event.guests || [];
  const schedule = event.schedule || [];

  // 1. Task metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;
  const todayIso = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(
    (t) => t.status === "pending" && t.dueDate && t.dueDate < todayIso,
  ).length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Vendor metrics
  const totalVendors = vendors.length;
  const bookedVendors = vendors.filter((v) => v.bookingStatus === "booked").length;
  const contactedVendors = vendors.filter((v) => v.bookingStatus === "contacted").length;
  const pendingVendors = vendors.filter(
    (v) => !v.bookingStatus || v.bookingStatus === "pending",
  ).length;
  const declinedVendors = vendors.filter((v) => v.bookingStatus === "declined").length;
  const vendorProgress = totalVendors > 0 ? Math.round((bookedVendors / totalVendors) * 100) : 0;

  // 3. Accurate Budget & Expenses (strictly 1:1, never double counted)
  const totalBudget = Number(event.plan?.budget?.total || event.input?.budget || 0);
  const totalEstimatedCost = expenses.reduce((sum, e) => sum + (Number(e.estimatedCost) || 0), 0);
  const totalActualCost = expenses.reduce((sum, e) => sum + (Number(e.actualCost) || 0), 0);
  const totalPaidAmount = expenses.reduce((sum, e) => sum + (Number(e.paidAmount) || 0), 0);
  const outstandingBalance = Math.max(0, totalActualCost - totalPaidAmount);
  const remainingBudget = totalBudget - totalActualCost;

  // 4. Guest metrics
  const totalInvited = guests.length;
  const attendingGuests = guests.filter((g) => g.rsvpStatus === "attending");
  const attendingCount = attendingGuests.reduce(
    (sum, g) => sum + 1 + (Number(g.plusOnes) || 0),
    0,
  );
  const declinedCount = guests.filter((g) => g.rsvpStatus === "declined").length;
  const pendingRsvpCount = guests.filter(
    (g) => g.rsvpStatus === "pending" || g.rsvpStatus === "tentative",
  ).length;

  // 5. Schedule metrics
  const totalScheduleItems = schedule.length;
  const completedScheduleItems = schedule.filter((s) => s.completed).length;

  // 6. Overall Weighted Preparation Progress (Tasks 45%, Vendors 45%, Schedule 10%)
  let overallProgress = 0;
  if (totalTasks > 0 && totalVendors > 0) {
    overallProgress = Math.round(taskProgress * 0.45 + vendorProgress * 0.45 + (totalScheduleItems > 0 ? (completedScheduleItems / totalScheduleItems) * 10 : 10));
  } else if (totalTasks > 0) {
    overallProgress = taskProgress;
  } else if (totalVendors > 0) {
    overallProgress = vendorProgress;
  }

  return {
    overallProgress: Math.min(100, Math.max(0, overallProgress)),
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      progressPercent: taskProgress,
    },
    vendors: {
      total: totalVendors,
      booked: bookedVendors,
      contacted: contactedVendors,
      pending: pendingVendors,
      declined: declinedVendors,
      progressPercent: vendorProgress,
    },
    budget: {
      totalBudget,
      currency: event.plan?.budget?.currency || event.input?.currency || "USD",
      totalEstimatedCost,
      totalActualCost,
      totalPaidAmount,
      outstandingBalance,
      remainingBudget,
      isOverBudget: remainingBudget < 0,
      spentPercentage: totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0,
    },
    guests: {
      totalInvited,
      attending: attendingCount,
      declined: declinedCount,
      pending: pendingRsvpCount,
      targetGuestCount: event.input?.guestCount || 0,
    },
    schedule: {
      total: totalScheduleItems,
      completed: completedScheduleItems,
    },
  };
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
  const events = await Event.find({ user: userId }).sort({ createdAt: -1 });

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
   AI POSTER STUDIO OPERATIONS
   ========================================================================== */

/**
 * Returns suggested poster styles and prompts tailored to the specific event.
 */
export async function getPosterSuggestions(eventId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  const eventName = event.plan?.summary?.eventName || event.input?.eventName || `${event.type || "Event"} Celebration`;
  const vibe = event.input?.vibe || "celebratory";

  return [
    {
      id: "style-1",
      name: "Modern Minimalist",
      style: "modern",
      prompt: `Minimalist modern typography poster for ${eventName}. Clean geometric layout with soft warm pastel tones, subtle gold framing, and serene festive elegance.`,
      palette: ["#1e293b", "#f8fafc", "#e2e8f0", "#6366f1"],
    },
    {
      id: "style-2",
      name: "Luxury Gold & Midnight",
      style: "luxury",
      prompt: `Opulent luxury event poster for ${eventName}. Midnight velvet background with sparkling gold foil accents, art-deco flourishes, and grand celebratory ambiance.`,
      palette: ["#0f172a", "#fbbf24", "#d97706", "#ffffff"],
    },
    {
      id: "style-3",
      name: "Botanical Garden",
      style: "botanical",
      prompt: `Lush botanical illustration poster for ${eventName}. Delicate eucalyptus leaves, soft peach and ivory florals, natural organic textures, and hand-lettered styling.`,
      palette: ["#14532d", "#86efac", "#fef3c7", "#1c1917"],
    },
    {
      id: "style-4",
      name: "Neon Festival Vibe",
      style: "neon",
      prompt: `Electric vibrant neon celebration poster for ${eventName} (${vibe}). Radiant glowing cyan and magenta lights, dynamic party energy, and bold typography.`,
      palette: ["#09090b", "#06b6d4", "#ec4899", "#a855f7"],
    },
  ];
}

/**
 * Generates an SVG vector graphic poster rendered according to the chosen style and event facts.
 */
export function generateSvgPoster({ title, subtitle, date, location, style = "modern" }) {
  const cleanTitle = (title || "Grand Celebration").replace(/[<>&"]/g, "");
  const cleanSub = (subtitle || "Join us for an unforgettable event").replace(/[<>&"]/g, "");
  const cleanDate = (date || "").replace(/[<>&"]/g, "");
  const cleanLoc = (location || "").replace(/[<>&"]/g, "");

  let bgGradient = `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1e2f" />
        <stop offset="50%" stop-color="#13141f" />
        <stop offset="100%" stop-color="#0a0a10" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ec4899" />
        <stop offset="50%" stop-color="#8b5cf6" />
        <stop offset="100%" stop-color="#3b82f6" />
      </linearGradient>
    </defs>
  `;
  let frameColor = "#4f46e5";
  let textColor = "#ffffff";
  let accentColor = "#a78bfa";

  if (style === "luxury") {
    bgGradient = `
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#1c1917" />
          <stop offset="100%" stop-color="#09090b" />
        </radialGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
    `;
    frameColor = "#f59e0b";
    textColor = "#fef08a";
    accentColor = "#fbbf24";
  } else if (style === "botanical") {
    bgGradient = `
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#064e3b" />
          <stop offset="100%" stop-color="#022c22" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#a7f3d0" />
          <stop offset="100%" stop-color="#fef3c7" />
        </linearGradient>
      </defs>
    `;
    frameColor = "#34d399";
    textColor = "#ecfdf5";
    accentColor = "#6ee7b7";
  } else if (style === "neon") {
    bgGradient = `
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09090b" />
          <stop offset="100%" stop-color="#180e29" />
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00f5ff" />
          <stop offset="50%" stop-color="#ff007f" />
          <stop offset="100%" stop-color="#ffe600" />
        </linearGradient>
      </defs>
    `;
    frameColor = "#00f5ff";
    textColor = "#ffffff";
    accentColor = "#ff007f";
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1120" width="100%" height="100%">
  ${bgGradient}
  <rect width="800" height="1120" fill="url(#bg)" />

  <!-- Outer Decorative Border -->
  <rect x="40" y="40" width="720" height="1040" rx="16" fill="none" stroke="${frameColor}" stroke-width="2" stroke-opacity="0.4" />
  <rect x="52" y="52" width="696" height="1016" rx="12" fill="none" stroke="${frameColor}" stroke-width="1" stroke-opacity="0.2" />

  <!-- Corner Flourishes -->
  <circle cx="52" cy="52" r="6" fill="${frameColor}" />
  <circle cx="748" cy="52" r="6" fill="${frameColor}" />
  <circle cx="52" cy="1068" r="6" fill="${frameColor}" />
  <circle cx="748" cy="1068" r="6" fill="${frameColor}" />

  <!-- Header Badge -->
  <g transform="translate(400, 160)">
    <rect x="-140" y="-22" width="280" height="44" rx="22" fill="${frameColor}" fill-opacity="0.15" stroke="${frameColor}" stroke-width="1.5" />
    <text text-anchor="middle" y="6" fill="${accentColor}" font-family="'Outfit', sans-serif" font-size="14" font-weight="700" letter-spacing="4">YOU ARE CORDIALLY INVITED</text>
  </g>

  <!-- Title -->
  <text text-anchor="middle" x="400" y="320" fill="${textColor}" font-family="'Outfit', sans-serif" font-size="44" font-weight="800" letter-spacing="1">
    ${cleanTitle.slice(0, 30)}
  </text>
  ${cleanTitle.length > 30 ? `<text text-anchor="middle" x="400" y="375" fill="${textColor}" font-family="'Outfit', sans-serif" font-size="36" font-weight="800">${cleanTitle.slice(30, 60)}</text>` : ""}

  <!-- Divider Line -->
  <line x1="260" y1="440" x2="540" y2="440" stroke="url(#accent)" stroke-width="3" stroke-linecap="round" />

  <!-- Subtitle / Vibe -->
  <text text-anchor="middle" x="400" y="510" fill="#cbd5e1" font-family="'Inter', sans-serif" font-size="20" font-weight="400" letter-spacing="0.5">
    ${cleanSub.slice(0, 48)}
  </text>
  ${cleanSub.length > 48 ? `<text text-anchor="middle" x="400" y="545" fill="#94a3b8" font-family="'Inter', sans-serif" font-size="18">${cleanSub.slice(48, 96)}</text>` : ""}

  <!-- Central Graphic Element -->
  <g transform="translate(400, 680)">
    <circle cx="0" cy="0" r="110" fill="none" stroke="url(#accent)" stroke-width="2" stroke-dasharray="6 6" />
    <circle cx="0" cy="0" r="85" fill="${frameColor}" fill-opacity="0.1" />
    <polygon points="0,-60 18,-18 60,-18 26,10 40,52 0,26 -40,52 -26,10 -60,-18 -18,-18" fill="url(#accent)" opacity="0.9" />
  </g>

  <!-- Event Details Box -->
  <g transform="translate(400, 880)">
    <rect x="-240" y="-45" width="480" height="90" rx="16" fill="#000000" fill-opacity="0.35" stroke="${frameColor}" stroke-width="1" />
    ${cleanDate ? `<text text-anchor="middle" y="-10" fill="${textColor}" font-family="'Outfit', sans-serif" font-size="22" font-weight="700">DATE: ${cleanDate}</text>` : ""}
    ${cleanLoc ? `<text text-anchor="middle" y="24" fill="${accentColor}" font-family="'Inter', sans-serif" font-size="16" font-weight="500">${cleanLoc}</text>` : `<text text-anchor="middle" y="24" fill="${accentColor}" font-family="'Inter', sans-serif" font-size="16" font-weight="500">HONORING OUR SPECIAL GUESTS</text>`}
  </g>

  <!-- Footer Tagline -->
  <text text-anchor="middle" x="400" y="1030" fill="#64748b" font-family="'Inter', sans-serif" font-size="13" letter-spacing="2">PLEASE RSVP AT YOUR EARLIEST CONVENIENCE</text>
</svg>
  `.trim();
}

/**
 * Generates an event poster using Google Gemini AI with customized prompt,
 * falling back to custom AI vector SVG and deterministic generator if needed.
 */
export async function generatePosterWithAi({ title, subtitle, date, location, style = "modern", prompt = "", eventType = "event", engine = "auto" }) {
  const result = await generatePosterWithGemini({ title, subtitle, date, location, style, prompt, eventType, engine });
  if (result?.data) {
    if (result.type === "svg" || typeof result.data === "string" && result.data.includes("<svg")) {
      result.data = sanitizeSvg(result.data);
      if (result.svg) result.svg = sanitizeSvg(result.svg);
    }
    return result;
  }
  const fallbackSvg = sanitizeSvg(generateSvgPoster({ title, subtitle, date, location, style }));
  return {
    type: "svg",
    data: fallbackSvg,
    svg: fallbackSvg,
  };
}

export async function savePoster(eventId, posterData, userId) {
  const event = await getOwnedEvent(eventId, userId);

  if (!posterData.imageData) {
    throw new AppError("Poster image data is required.", HTTP_STATUS.BAD_REQUEST);
  }

  const cleanImageData = sanitizeSvg(posterData.imageData);
  if (!cleanImageData) {
    throw new AppError("Invalid or disallowed poster image data.", HTTP_STATUS.BAD_REQUEST);
  }

  const newPoster = {
    id: `poster-${randomUUID().slice(0, 8)}`,
    title: posterData.title?.trim() || "Event Poster",
    prompt: posterData.prompt?.trim() || "Custom Design",
    style: posterData.style || "modern",
    imageData: cleanImageData,
    createdAt: new Date(),
  };

  event.posters.push(newPoster);
  await event.save();
  return { poster: newPoster, posters: event.posters };
}

export async function deletePoster(eventId, posterId, userId) {
  const event = await getOwnedEvent(eventId, userId);

  event.posters = event.posters.filter((p) => p.id !== posterId);
  await event.save();
  return { posters: event.posters };
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


