import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export function requireTrustedOrigin(req, res, next) {
  const origin = req.get("origin");

  // Browser requests that include Origin must match the configured client.
  if (origin && origin !== env.CLIENT_URL) {
    return next(
      new ApiError(
        403,
        "Request origin is not allowed",
        "UNTRUSTED_ORIGIN"
      )
    );
  }

  next();
}