import { Router } from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { protect } from "../middlewares/auth.middleware.js";
import * as eventController from "../controllers/event.controller.js";

const router = Router();

// All event routes require authentication
router.use(protect);

// Base CRUD
router.post("/", asyncHandler(eventController.createEvent));
router.get("/", asyncHandler(eventController.listEvents));
router.get("/:id", asyncHandler(eventController.getEvent));
router.delete("/:id", asyncHandler(eventController.deleteEvent));

// Tasks (Separate from vendor status)
router.post("/:id/tasks", asyncHandler(eventController.createTask));
router.patch("/:id/tasks/:taskId", asyncHandler(eventController.updateTask));
router.delete("/:id/tasks/:taskId", asyncHandler(eventController.deleteTask));

// Vendors (Separate from task status)
router.post("/:id/vendors", asyncHandler(eventController.createVendor));
router.patch("/:id/vendors/:vendorId", asyncHandler(eventController.updateVendor));
router.delete("/:id/vendors/:vendorId", asyncHandler(eventController.deleteVendor));

// Expenses (No double counting)
router.post("/:id/expenses", asyncHandler(eventController.createExpense));
router.patch("/:id/expenses/:expenseId", asyncHandler(eventController.updateExpense));
router.delete("/:id/expenses/:expenseId", asyncHandler(eventController.deleteExpense));

// Guests (RSVP, Plus-Ones, CSV import)
router.post("/:id/guests", asyncHandler(eventController.createGuest));
router.post("/:id/guests/import", asyncHandler(eventController.importGuests));
router.patch("/:id/guests/:guestId", asyncHandler(eventController.updateGuest));
router.delete("/:id/guests/:guestId", asyncHandler(eventController.deleteGuest));

// Schedule / Day-of Run Sheet
router.post("/:id/schedule", asyncHandler(eventController.createScheduleItem));
router.patch("/:id/schedule/:itemId", asyncHandler(eventController.updateScheduleItem));
router.delete("/:id/schedule/:itemId", asyncHandler(eventController.deleteScheduleItem));

// AI Poster Studio
router.get("/:id/posters/suggestions", asyncHandler(eventController.getPosterSuggestions));
router.post("/:id/posters/generate", asyncHandler(eventController.generatePoster));
router.post("/:id/posters", asyncHandler(eventController.savePoster));
router.delete("/:id/posters/:posterId", asyncHandler(eventController.deletePoster));

// AI Inspirations & Creative Themes
router.post("/:id/generate-ideas", asyncHandler(eventController.generateEventIdeas));

export default router;

