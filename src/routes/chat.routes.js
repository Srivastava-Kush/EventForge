import { Router } from "express";
import { body } from "express-validator";
import asyncHandler from "../middlewares/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import { protect } from "../middlewares/auth.middleware.js";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();

// All chat routes require authentication
router.use(protect);

const messageValidator = [
  body("message")
    .trim()
    .notEmpty().withMessage("Message cannot be empty.")
    .isLength({ max: 2000 }).withMessage("Message must be at most 2000 characters."),
];

router.post("/", messageValidator, validate, asyncHandler(chatController.sendMessage));
router.get("/history", asyncHandler(chatController.getHistory));

export default router;
