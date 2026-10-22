import mongoose from "mongoose";
import { EVENT_TYPES } from "../constants/eventTypes.js";

const taskItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    phase: { type: String, default: "Plan & book" },
    dueDate: { type: String, default: "" },
    urgent: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    assignedTo: { type: String, default: "" },
    isCustom: { type: Boolean, default: false },
  },
  { _id: false },
);

const vendorItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    priority: { type: String, enum: ["essential", "recommended", "optional"], default: "essential" },
    matchesPriority: { type: Boolean, default: false },
    bookBy: { type: String, default: "" },
    bookNow: { type: Boolean, default: false },
    tip: { type: String, default: "" },
    bookingStatus: {
      type: String,
      enum: ["pending", "contacted", "booked", "declined"],
      default: "pending",
    },
    vendorName: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    quotationAmount: { type: Number, default: 0 },
    agreedAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    documents: [
      {
        name: { type: String, default: "" },
        url: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false },
);

const expenseItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: "General" },
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid"],
      default: "unpaid",
    },
    dueDate: { type: String, default: "" },
    paidDate: { type: String, default: "" },
    linkedVendorId: { type: String, default: null },
    linkedTaskId: { type: String, default: null },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const guestItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    group: { type: String, default: "General" },
    invitationStatus: {
      type: String,
      enum: ["not_sent", "sent", "opened"],
      default: "not_sent",
    },
    rsvpStatus: {
      type: String,
      enum: ["pending", "attending", "declined", "tentative"],
      default: "pending",
    },
    plusOnes: { type: Number, default: 0 },
    plusOneNames: { type: String, default: "" },
    dietary: { type: String, default: "" },
    tableOrSeating: { type: String, default: "" },
    notes: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const scheduleItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, default: "" },
    activity: { type: String, required: true },
    location: { type: String, default: "" },
    responsiblePerson: { type: String, default: "" },
    relatedVendorId: { type: String, default: null },
    notes: { type: String, default: "" },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const posterItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: "Event Poster" },
    prompt: { type: String, required: true },
    style: { type: String, default: "modern" },
    imageData: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
    },
    /** The full validated planner input (what the form collects) */
    input: {
      type: Object,
      required: true,
    },
    /** The full buildPlan() output */
    plan: {
      type: Object,
      required: true,
    },
    /** The LLM getIdeas() output */
    ideas: {
      type: Object,
      default: null,
    },
    /** Interactive tasks */
    tasks: {
      type: [taskItemSchema],
      default: [],
    },
    /** Interactive vendors */
    vendors: {
      type: [vendorItemSchema],
      default: [],
    },
    /** Individual expense records */
    expenses: {
      type: [expenseItemSchema],
      default: [],
    },
    /** Guest records */
    guests: {
      type: [guestItemSchema],
      default: [],
    },
    /** Day-of schedule / run sheet */
    schedule: {
      type: [scheduleItemSchema],
      default: [],
    },
    /** AI poster studio creations */
    posters: {
      type: [posterItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

// Newest first by default
eventSchema.index({ user: 1, createdAt: -1 });

const Event = mongoose.model("Event", eventSchema);
export default Event;
