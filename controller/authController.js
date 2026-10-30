import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  getCurrentUser,
  updateCurrentUser,
} from "../service/authService.js";

import { env } from "../config/env.js";

const COOKIE_NAME = "church_refresh";

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    expires: expiresAt,
    path: `${env.API_PREFIX}/auth`,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: `${env.API_PREFIX}/auth`,
  });
}

export async function registerController(req, res) {
  const user = await registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user },
  });
}

export async function loginController(req, res) {
  const result = await loginUser(req.body, req);

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshTokenExpiresAt
  );

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

export async function refreshController(req, res) {
  const result = await refreshUserSession(
    req.cookies?.[COOKIE_NAME],
    req
  );

  setRefreshCookie(
    res,
    result.refreshToken,
    result.refreshTokenExpiresAt
  );

  return res.status(200).json({
    success: true,
    message: "Session refreshed successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
}

export async function logoutController(req, res) {
  await logoutUser(req.cookies?.[COOKIE_NAME]);

  clearRefreshCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}

export async function meController(req, res) {
  const user = await getCurrentUser(req.user._id);

  return res.status(200).json({
    success: true,
    message: "Current user retrieved successfully",
    data: { user },
  });
}

export async function updateMeController(req, res) {
  const user = await updateCurrentUser(req.user._id, req.body);

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
}
