import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(2000),

  API_PREFIX: z
    .string()
    .default("/api/v1")
    .refine(
      (value) =>
        value.startsWith("/") &&
        !value.endsWith("/") &&
        !value.includes("?") &&
        !value.includes("#"),
      "API_PREFIX must start with / and must not end with /"
    ),

  MONGODB_URI: z.string().min(1),

  CLIENT_URL: z.string().url().default("http://localhost:5173"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(30).default(7),

  COOKIE_SAME_SITE: z
    .enum(["strict", "lax", "none"])
    .default("lax"),

  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment configuration:",
    result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
  );

  process.exit(1);
}

export const env = Object.freeze(result.data);