import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

/**
 * Middleware: runs after express-validator chains.
 * If there are validation errors, formats them into { field, message }[] and throws AppError 422.
 * Usage: router.post("/", [...validatorChains], validate, controller)
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((err) => ({
    field: err.path || err.param || "body",
    message: err.msg,
  }));
  return next(new AppError("Validation failed.", HTTP_STATUS.UNPROCESSABLE_ENTITY, errors));
}

