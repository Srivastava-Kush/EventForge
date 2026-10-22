import { Router } from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import { protect } from "../middlewares/auth.middleware.js";
import { registerValidator, loginValidator } from "../validators/auth.validator.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerValidator, validate, asyncHandler(authController.register));
router.post("/login", loginValidator, validate, asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", protect, asyncHandler(authController.getMe));

export default router;
