import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { computeMetrics } from "./eventMetrics.service.js";
import { findSubEntityIndex, removeSubEntity } from "./subdocument.utils.js";
import { getOwnedEvent } from "./event.service.js";

/**
 * Transforms planned timeline tasks into interactive task subdocuments.
 * @param {any[]} [planTasks=[]]
 * @returns {any[]}
 */
export function initializeTasksFromPlan(planTasks = []) {
  return (planTasks || []).map((t) => ({
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
}

/**
 * Creates a custom task under the target event.
 * @param {string} eventId
 * @param {any} taskData
 * @param {string} userId
 * @returns {Promise<{ task: any, metrics: any }>}
 */
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

/**
 * Updates an existing task subdocument.
 * @param {string} eventId
 * @param {string} taskId
 * @param {any} updates
 * @param {string} userId
 * @returns {Promise<{ task: any, metrics: any }>}
 */
export async function updateTask(eventId, taskId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);
  const taskIndex = findSubEntityIndex(event, "tasks", taskId, "Task");

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

/**
 * Deletes a task subdocument from the target event.
 * @param {string} eventId
 * @param {string} taskId
 * @param {string} userId
 * @returns {Promise<{ metrics: object }>}
 */
export async function deleteTask(eventId, taskId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return removeSubEntity(event, "tasks", taskId);
}
