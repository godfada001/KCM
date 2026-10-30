import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import User from "../model/userModel.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(
  async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "Authentication required",
        "UNAUTHENTICATED"
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new ApiError(
        401,
        "Authentication required",
        "UNAUTHENTICATED"
      );
    }

    let payload;

    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ["HS256"],
        issuer: "church-api",
        audience: "church-api-client",
      });
    } catch {
      throw new ApiError(
        401,
        "Invalid or expired access token",
        "INVALID_ACCESS_TOKEN"
      );
    }

    if (
      typeof payload !== "object" ||
      typeof payload.sub !== "string"
    ) {
      throw new ApiError(
        401,
        "Invalid access token",
        "INVALID_ACCESS_TOKEN"
      );
    }

    const user = await User.findById(payload.sub);

    if (!user || user.status !== "active") {
      throw new ApiError(
        401,
        "Account is unavailable",
        "ACCOUNT_UNAVAILABLE"
      );
    }

    req.user = user;

    next();
  }
);