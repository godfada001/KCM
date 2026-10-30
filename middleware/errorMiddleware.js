import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_SERVER_ERROR";
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed";
    code = "DATABASE_VALIDATION_ERROR";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier";
    code = "INVALID_ID";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
    code = "DUPLICATE_RECORD";
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const response = {
    success: false,
    message,
    error: { code },
  };

  if (details) {
    response.error.details = details;
  }

  if (env.NODE_ENV === "development" && statusCode >= 500) {
    response.error.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}