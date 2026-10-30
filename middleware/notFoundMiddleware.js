import { ApiError } from "../utils/apiError.js";

export function notFoundMiddleware(req, res, next) {
  next(
    new ApiError(
      404,
      `Route not found: ${req.method} ${req.originalUrl}`,
      "ROUTE_NOT_FOUND"
    )
  );
}