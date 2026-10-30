import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

function isSameOriginRequest(req, origin) {
  try {
    const originUrl = new URL(origin);
    const requestHost = req.get("x-forwarded-host") || req.get("host");
    const requestProtocol =
      req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;

    return originUrl.host === requestHost && originUrl.protocol === `${requestProtocol}:`;
  } catch {
    return false;
  }
}

export function requireTrustedOrigin(req, res, next) {
  const origin = req.get("origin");

  // Allow the configured frontend and the same-origin production deployment.
  if (origin && origin !== env.CLIENT_URL && !isSameOriginRequest(req, origin)) {
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
