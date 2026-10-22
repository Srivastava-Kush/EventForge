import * as authService from "../services/auth.service.js";
import { sendResponse } from "../utils/sendResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
const isProd = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/** POST /api/auth/register */
export async function register(req, res) {
  const { name, email, password } = req.body;
  const { user, token } = await authService.registerUser({ name, email, password });

  res.cookie("token", token, COOKIE_OPTIONS);
  return sendResponse(res, HTTP_STATUS.CREATED, true, {
    user,
    id: user.id,
    name: user.name,
    email: user.email,
  });
}

/** POST /api/auth/login */
export async function login(req, res) {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser({ email, password });

  res.cookie("token", token, COOKIE_OPTIONS);
  return sendResponse(res, HTTP_STATUS.OK, true, {
    user,
    id: user.id,
    name: user.name,
    email: user.email,
  });
}

/** POST /api/auth/logout */
export async function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  return sendResponse(res, HTTP_STATUS.OK, true, null, "Logged out successfully.");
}


/** GET /api/auth/me */
export async function getMe(req, res) {
  const { _id, id, name, email, createdAt } = req.user;
  const userId = id || _id;
  return sendResponse(res, HTTP_STATUS.OK, true, {
    user: { id: userId, name, email, createdAt },
    id: userId,
    name,
    email,
    createdAt,
  });
}

