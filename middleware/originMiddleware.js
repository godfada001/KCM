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

const trustedOrigins = Array.isArray(env.CLIENT_URL)
  ? env.CLIENT_URL
  : [env.CLIENT_URL];

function isTrustedOrigin(origin) {
  if (!origin) return false;

  try {
    const requestOrigin = new URL(origin);

    return trustedOrigins.some((trustedOrigin) => {
      try {
        const parsedTrustedOrigin = new URL(trustedOrigin);
        return requestOrigin.origin === parsedTrustedOrigin.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function requireTrustedOrigin(req, res, next) {
  const origin = req.get("origin");

  // Allow the configured frontend and the same-origin production deployment.
  if (origin && !isTrustedOrigin(origin) && !isSameOriginRequest(req, origin)) {
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
