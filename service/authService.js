import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";

import { env } from "../config/env.js";
import User from "../model/userModel.js";
import RefreshSession from "../utils/refreshSessionModel.js";
import { ApiError } from "../utils/apiError.js";

const ACCESS_ISSUER = "church-api";
const ACCESS_AUDIENCE = "church-api-client";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
    },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: "HS256",
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: ACCESS_ISSUER,
      audience: ACCESS_AUDIENCE,
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    address: user.address ?? null,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

function validatePasswordBytes(password) {
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new ApiError(
      400,
      "Password must not exceed 72 bytes",
      "PASSWORD_TOO_LONG"
    );
  }
}

async function createRefreshSession(user, req) {
  const refreshToken = randomBytes(32).toString("base64url");

  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
  );

  await RefreshSession.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: req.get("user-agent")?.slice(0, 500) ?? null,
  });

  return {
    refreshToken,
    expiresAt,
  };
}

export async function registerUser(input) {
  const email = normalizeEmail(input.email);

  validatePasswordBytes(input.password);

  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists",
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    passwordHash,
    role: "member",
    status: "active",
  });

  return publicUser(user);
}

export async function loginUser(input, req) {
  const email = normalizeEmail(input.email);

  const user = await User.findOne({ email }).select("+passwordHash");

  const passwordMatches = user
    ? await bcrypt.compare(input.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw new ApiError(
      401,
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  if (user.status !== "active") {
    throw new ApiError(
      403,
      "This account is not active",
      "ACCOUNT_INACTIVE"
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const session = await createRefreshSession(user, req);

  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
    refreshToken: session.refreshToken,
    refreshTokenExpiresAt: session.expiresAt,
  };
}

export async function refreshUserSession(token, req) {
  if (!token) {
    throw new ApiError(
      401,
      "Refresh session required",
      "REFRESH_SESSION_REQUIRED"
    );
  }

  const tokenHash = hashToken(token);

  const session = await RefreshSession.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");

  if (!session) {
    throw new ApiError(
      401,
      "Invalid or expired refresh session",
      "INVALID_REFRESH_SESSION"
    );
  }

  const user = await User.findById(session.user);

  if (!user || user.status !== "active") {
    session.revokedAt = new Date();
    await session.save();

    throw new ApiError(
      401,
      "Account is unavailable",
      "ACCOUNT_UNAVAILABLE"
    );
  }

  // Rotate the refresh token. The previous token is revoked.
  session.revokedAt = new Date();
  await session.save();

  const newSession = await createRefreshSession(user, req);

  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
    refreshToken: newSession.refreshToken,
    refreshTokenExpiresAt: newSession.expiresAt,
  };
}

export async function logoutUser(token) {
  if (!token) return;

  await RefreshSession.updateOne(
    {
      tokenHash: hashToken(token),
      revokedAt: null,
    },
    {
      $set: { revokedAt: new Date() },
    }
  );
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user || user.status !== "active") {
    throw new ApiError(
      404,
      "User not found",
      "USER_NOT_FOUND"
    );
  }

  return publicUser(user);
}

export async function updateCurrentUser(userId, input) {
  const user = await User.findById(userId);

  if (!user || user.status !== "active") {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    const existingUser = await User.exists({ email, _id: { $ne: user._id } });
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists", "EMAIL_ALREADY_EXISTS");
    }
    user.email = email;
  }

  for (const field of ["firstName", "lastName", "phone", "address"]) {
    if (input[field] !== undefined) user[field] = input[field] || null;
  }

  await user.save();
  return publicUser(user);
}
