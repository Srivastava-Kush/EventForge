import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { AppError } from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { loadEnv } from "../config/env.js";

function getAuthConfig() {
  try {
    return loadEnv();
  } catch {
    return { jwtSecret: process.env.JWT_SECRET || "changeme-in-production", jwtExpiresIn: "7d" };
  }
}

/**
 * Signs a JWT token for a user ID.
 * @param {string|import("mongoose").Types.ObjectId} id
 * @returns {string}
 */
export function signToken(id) {
  const config = getAuthConfig();
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: "HS256",
  });
}

/**
 * Registers a new user. Throws AppError 409 if email is already taken.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ user: { id: string, name: string, email: string }, token: string }>}
 */
export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email }).select("_id").lean();
  if (existing) {
    throw new AppError("Email is already registered.", HTTP_STATUS.CONFLICT);
  }


  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return {
    user: { id: user._id, name: user.name, email: user.email },
    token,
  };
}

/**
 * Authenticates user credentials. Throws AppError 401 if invalid.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: { id: string, name: string, email: string }, token: string }>}
 */
export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
  }

  const token = signToken(user._id);

  return {
    user: { id: user._id, name: user.name, email: user.email },
    token,
  };
}

/**
 * Finds user by ID without password. Throws AppError 404 if not found.
 * @param {string} id
 * @returns {Promise<{ id: string, name: string, email: string, createdAt: Date }>}
 */
export async function getUserById(id) {
  const user = await User.findById(id).select("-password").lean();
  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
