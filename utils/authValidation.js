import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(72),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(80).optional(),
    lastName: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one profile field to update",
  }),
  params: z.object({}),
  query: z.object({}),
});
