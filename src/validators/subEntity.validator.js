import { body } from "express-validator";

/** Task Validation Rules */
export const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required.")
    .isLength({ max: 200 })
    .withMessage("Task title cannot exceed 200 characters."),
  body("phase").optional().trim().isLength({ max: 100 }),
  body("status").optional().isIn(["pending", "completed"]).withMessage("Status must be pending or completed."),
  body("notes").optional().trim().isLength({ max: 2000 }),
  body("dueDate").optional().trim(),
  body("urgent").optional().isBoolean(),
  body("assignedTo").optional().trim().isLength({ max: 100 }),
];

export const updateTaskValidator = [
  body("title").optional().trim().isLength({ min: 1, max: 200 }).withMessage("Task title cannot exceed 200 characters."),
  body("phase").optional().trim().isLength({ max: 100 }),
  body("status").optional().isIn(["pending", "completed"]).withMessage("Status must be pending or completed."),
  body("notes").optional().trim().isLength({ max: 2000 }),
  body("dueDate").optional().trim(),
  body("urgent").optional().isBoolean(),
  body("assignedTo").optional().trim().isLength({ max: 100 }),
];

/** Vendor Validation Rules */
export const createVendorValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Vendor category name is required.")
    .isLength({ max: 200 })
    .withMessage("Category name cannot exceed 200 characters."),
  body("vendorName").optional().trim().isLength({ max: 200 }),
  body("contactPerson").optional().trim().isLength({ max: 100 }),
  body("contactEmail").optional().trim().isLength({ max: 150 }),
  body("contactPhone").optional().trim().isLength({ max: 50 }),
  body("bookingStatus")
    .optional()
    .isIn(["pending", "contacted", "booked", "declined"])
    .withMessage("Invalid booking status."),
  body("quotationAmount").optional().isNumeric().withMessage("Quotation amount must be a number."),
  body("agreedAmount").optional().isNumeric().withMessage("Agreed amount must be a number."),
  body("paidAmount").optional().isNumeric().withMessage("Paid amount must be a number."),
];

export const updateVendorValidator = [
  body("name").optional().trim().isLength({ min: 1, max: 200 }).withMessage("Category name cannot exceed 200 characters."),
  body("vendorName").optional().trim().isLength({ max: 200 }),
  body("contactPerson").optional().trim().isLength({ max: 100 }),
  body("contactEmail").optional().trim().isLength({ max: 150 }),
  body("contactPhone").optional().trim().isLength({ max: 50 }),
  body("bookingStatus")
    .optional()
    .isIn(["pending", "contacted", "booked", "declined"])
    .withMessage("Invalid booking status."),
  body("quotationAmount").optional().isNumeric().withMessage("Quotation amount must be a number."),
  body("agreedAmount").optional().isNumeric().withMessage("Agreed amount must be a number."),
  body("paidAmount").optional().isNumeric().withMessage("Paid amount must be a number."),
];

/** Expense Validation Rules */
export const createExpenseValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Expense title is required.")
    .isLength({ max: 200 })
    .withMessage("Expense title cannot exceed 200 characters."),
  body("category").optional().trim().isLength({ max: 100 }),
  body("estimatedCost").optional().isNumeric().withMessage("Estimated cost must be a number."),
  body("actualCost").optional().isNumeric().withMessage("Actual cost must be a number."),
  body("paidAmount").optional().isNumeric().withMessage("Paid amount must be a number."),
  body("status").optional().isIn(["unpaid", "partially_paid", "paid"]).withMessage("Invalid expense status."),
];

export const updateExpenseValidator = [
  body("title").optional().trim().isLength({ min: 1, max: 200 }).withMessage("Expense title cannot exceed 200 characters."),
  body("category").optional().trim().isLength({ max: 100 }),
  body("estimatedCost").optional().isNumeric().withMessage("Estimated cost must be a number."),
  body("actualCost").optional().isNumeric().withMessage("Actual cost must be a number."),
  body("paidAmount").optional().isNumeric().withMessage("Paid amount must be a number."),
  body("status").optional().isIn(["unpaid", "partially_paid", "paid"]).withMessage("Invalid expense status."),
];

/** Guest Validation Rules */
export const createGuestValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Guest name is required.")
    .isLength({ max: 100 })
    .withMessage("Guest name cannot exceed 100 characters."),
  body("email").optional().trim().isLength({ max: 150 }),
  body("phone").optional().trim().isLength({ max: 50 }),
  body("group").optional().trim().isLength({ max: 100 }),
  body("invitationStatus")
    .optional()
    .isIn(["not_sent", "sent", "opened", "bounced"])
    .withMessage("Invalid invitation status."),
  body("rsvpStatus")
    .optional()
    .isIn(["pending", "accepted", "declined", "tentative"])
    .withMessage("Invalid RSVP status."),
  body("plusOnes").optional().isInt({ min: 0, max: 20 }).withMessage("Plus ones must be between 0 and 20."),
  body("notes").optional().trim().isLength({ max: 500 }),
];

export const updateGuestValidator = [
  body("name").optional().trim().isLength({ min: 1, max: 100 }).withMessage("Guest name cannot exceed 100 characters."),
  body("email").optional().trim().isLength({ max: 150 }),
  body("phone").optional().trim().isLength({ max: 50 }),
  body("group").optional().trim().isLength({ max: 100 }),
  body("invitationStatus")
    .optional()
    .isIn(["not_sent", "sent", "opened", "bounced"])
    .withMessage("Invalid invitation status."),
  body("rsvpStatus")
    .optional()
    .isIn(["pending", "accepted", "declined", "tentative"])
    .withMessage("Invalid RSVP status."),
  body("plusOnes").optional().isInt({ min: 0, max: 20 }).withMessage("Plus ones must be between 0 and 20."),
  body("notes").optional().trim().isLength({ max: 500 }),
];

/** Schedule Item Validation Rules */
export const createScheduleItemValidator = [
  body("startTime").trim().notEmpty().withMessage("Start time is required.").isLength({ max: 50 }),
  body("activity").trim().notEmpty().withMessage("Activity is required.").isLength({ max: 300 }),
  body("endTime").optional().trim().isLength({ max: 50 }),
  body("location").optional().trim().isLength({ max: 200 }),
  body("responsiblePerson").optional().trim().isLength({ max: 100 }),
  body("notes").optional().trim().isLength({ max: 1000 }),
];

export const updateScheduleItemValidator = [
  body("startTime").optional().trim().isLength({ min: 1, max: 50 }),
  body("activity").optional().trim().isLength({ min: 1, max: 300 }),
  body("endTime").optional().trim().isLength({ max: 50 }),
  body("location").optional().trim().isLength({ max: 200 }),
  body("responsiblePerson").optional().trim().isLength({ max: 100 }),
  body("notes").optional().trim().isLength({ max: 1000 }),
  body("completed").optional().isBoolean(),
];
