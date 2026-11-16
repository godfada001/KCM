/*import express from "express";
import bibleRouter from "./routes/bible.js";

const app = express();
app.use("/api/bible", bibleRouter);
app.listen(process.env.PORT || 4000);*/

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import apiRoutes from "./routes/indexRoute.js";
import swaggerSpec from "./config/swagger.js";

import {
  notFoundMiddleware,
} from "./middleware/notFoundMiddleware.js";

import {
  errorMiddleware,
} from "./middleware/errorMiddleware.js";

const app = express();
app.use(cookieParser());

// Security headers
app.use(helmet());

const allowedOrigins = Array.isArray(env.CLIENT_URL)
  ? env.CLIENT_URL
  : [env.CLIENT_URL];

// Configure permitted frontend origins
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const requestOrigin = new URL(origin);
        const isAllowed = allowedOrigins.some((allowedOrigin) => {
          try {
            const parsedAllowed = new URL(allowedOrigin);
            return requestOrigin.origin === parsedAllowed.origin;
          } catch {
            return false;
          }
        });

        if (isAllowed) {
          callback(null, true);
          return;
        }
      } catch {
        callback(new Error("Not allowed by CORS"));
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies
app.use(
  express.json({
    limit: "1mb",
  })
);

// Parse URL-encoded request bodies
app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

// HTTP request logging
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    error: {
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Church API Documentation",
  })
);

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

// Basic health endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Versioned API
app.use(env.API_PREFIX, apiLimiter, apiRoutes);

// Unknown routes
app.use(notFoundMiddleware);

// Centralized error handling — keep this last
app.use(errorMiddleware);

export default app;