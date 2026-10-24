import { Router } from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.js";
import { createRateLimiterMiddleware } from "../middlewares/rateLimiter.middleware.js";
import * as eventController from "../controllers/event.controller.js";
import {
  createTaskValidator,
  updateTaskValidator,
  createVendorValidator,
  updateVendorValidator,
  createExpenseValidator,
  updateExpenseValidator,
  createGuestValidator,
  updateGuestValidator,
  createScheduleItemValidator,
  updateScheduleItemValidator,
} from "../validators/subEntity.validator.js";

const router = Router();
const aiLimiter = createRateLimiterMiddleware({ limit: 10, windowMs: 60_000 });

// All event routes require authentication
router.use(protect);

// Base CRUD
router.post("/", asyncHandler(eventController.createEvent));
router.get("/", asyncHandler(eventController.listEvents));
router.get("/:id", asyncHandler(eventController.getEvent));
router.delete("/:id", asyncHandler(eventController.deleteEvent));

// Tasks (Separate from vendor status)
router.post("/:id/tasks", createTaskValidator, validate, asyncHandler(eventController.createTask));
router.patch("/:id/tasks/:taskId", updateTaskValidator, validate, asyncHandler(eventController.updateTask));
router.delete("/:id/tasks/:taskId", asyncHandler(eventController.deleteTask));

// Vendors (Separate from task status)
router.post("/:id/vendors", createVendorValidator, validate, asyncHandler(eventController.createVendor));
router.patch("/:id/vendors/:vendorId", updateVendorValidator, validate, asyncHandler(eventController.updateVendor));
router.delete("/:id/vendors/:vendorId", asyncHandler(eventController.deleteVendor));

// Expenses (No double counting)
router.post("/:id/expenses", createExpenseValidator, validate, asyncHandler(eventController.createExpense));
router.patch("/:id/expenses/:expenseId", updateExpenseValidator, validate, asyncHandler(eventController.updateExpense));
router.delete("/:id/expenses/:expenseId", asyncHandler(eventController.deleteExpense));

// Guests (RSVP, Plus-Ones, CSV import)
router.post("/:id/guests", createGuestValidator, validate, asyncHandler(eventController.createGuest));
router.post("/:id/guests/import", asyncHandler(eventController.importGuests));
router.patch("/:id/guests/:guestId", updateGuestValidator, validate, asyncHandler(eventController.updateGuest));
router.delete("/:id/guests/:guestId", asyncHandler(eventController.deleteGuest));

// Schedule / Day-of Run Sheet
router.post("/:id/schedule", createScheduleItemValidator, validate, asyncHandler(eventController.createScheduleItem));
router.patch("/:id/schedule/:itemId", updateScheduleItemValidator, validate, asyncHandler(eventController.updateScheduleItem));
router.delete("/:id/schedule/:itemId", asyncHandler(eventController.deleteScheduleItem));

// AI Poster Studio
router.get("/:id/posters/suggestions", asyncHandler(eventController.getPosterSuggestions));
router.post("/:id/posters/generate", aiLimiter, asyncHandler(eventController.generatePoster));
router.post("/:id/posters", asyncHandler(eventController.savePoster));
router.delete("/:id/posters/:posterId", asyncHandler(eventController.deletePoster));

// AI Inspirations & Creative Themes
router.post("/:id/generate-ideas", aiLimiter, asyncHandler(eventController.generateEventIdeas));

export default router;

