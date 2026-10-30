import { randomUUID } from "node:crypto";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { computeMetrics } from "./eventMetrics.service.js";
import { findSubEntityIndex, removeSubEntity } from "./subdocument.utils.js";
import { getOwnedEvent } from "./event.service.js";

/**
 * Transforms planned vendor categories into interactive vendor subdocuments.
 * @param {any[]} [planVendors=[]]
 * @returns {any[]}
 */
export function initializeVendorsFromPlan(planVendors = []) {
  return (planVendors || []).map((v) => ({
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
}

/**
 * Creates a vendor subdocument under the target event.
 * @param {string} eventId
 * @param {any} vendorData
 * @param {string} userId
 * @returns {Promise<{ vendor: any, metrics: any }>}
 */
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

/**
 * Updates an existing vendor subdocument.
 * @param {string} eventId
 * @param {string} vendorId
 * @param {any} updates
 * @param {string} userId
 * @returns {Promise<{ vendor: any, metrics: any }>}
 */
export async function updateVendor(eventId, vendorId, updates, userId) {
  const event = await getOwnedEvent(eventId, userId);
  const vendorIndex = findSubEntityIndex(event, "vendors", vendorId, "Vendor");

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

/**
 * Deletes a vendor subdocument from the target event.
 * @param {string} eventId
 * @param {string} vendorId
 * @param {string} userId
 * @returns {Promise<{ metrics: object }>}
 */
export async function deleteVendor(eventId, vendorId, userId) {
  const event = await getOwnedEvent(eventId, userId);
  return removeSubEntity(event, "vendors", vendorId);
}
