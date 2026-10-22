import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import User from "../models/User.model.js";
/**
 * Middleware: verifies JWT from httpOnly cookie or Authorization Bearer header, attaches req.user.
 * Throws 401 AppError for any auth failure so global handler formats response consistently.
 */
export async function protect(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authenticated. Please log in.", HTTP_STATUS.UNAUTHORIZED));
  }

  let decoded;
  try {
    const secret = process.env.JWT_SECRET || "changeme-in-production";
    decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return next(new AppError("Invalid or expired session. Please log in again.", HTTP_STATUS.UNAUTHORIZED));
  }

  try {
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new AppError("User no longer exists.", HTTP_STATUS.UNAUTHORIZED));
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

