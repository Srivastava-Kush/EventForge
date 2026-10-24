import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { computeMetrics } from "./eventMetrics.service.js";
import { findSubEntityIndex, removeSubEntity } from "./subdocument.utils.js";
import { getOwnedEvent } from "./event.service.js";

/**
 * Transforms planned budget items into interactive expense subdocuments.
 * @param {Array<object>} [budgetItems=[]]
 * @returns {Array<object>}
 */
export function initializeExpensesFromPlan(budgetItems = []) {
  return (budgetItems || []).map((b) => ({
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
}

/**
 * Creates an expense subdocument under the target event.
 * @param {string} eventId
 * @param {object} expenseData
 * @param {string} userId
 * @returns {Promise<{ expense: object, metrics: object }>}
 */
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

/**
 * Updates an existing expense subdocument.
 * @param {string} eventId
 * @param {string} expenseId
 * @param {object} updates
 * @param {string} userId
 * @returns {Promise<{ expense: object, metrics: object }>}
 */
export async function updateExpense(eventId, expenseId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);
  const expIndex = findSubEntityIndex(event, "expenses", expenseId, "Expense");

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

/**
 * Deletes an expense subdocument from the target event.
 * @param {string} eventId
 * @param {string} expenseId
 * @param {string} userId
 * @returns {Promise<{ metrics: object }>}
 */
export async function deleteExpense(eventId, expenseId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return removeSubEntity(event, "expenses", expenseId);
}
