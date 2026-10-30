import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid user ID");

export const userIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const listUsersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum([
      "member",
      "pastor",
      "ministry_leader",
      "finance",
      "admin",
    ]).optional(),
    status: z.enum([
      "active",
      "suspended",
      "disabled",
    ]).optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum([
      "member",
      "pastor",
      "ministry_leader",
      "finance",
      "admin",
    ]),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "active",
      "suspended",
      "disabled",
    ]),
  }),
  params: z.object({
    id: objectIdSchema,
  }),
  query: z.object({}),
});