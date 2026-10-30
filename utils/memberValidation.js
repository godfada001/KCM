import { z } from "zod";

const objectId = z.string().regex(
  /^[a-f\d]{24}$/i,
  "Invalid ID"
);

const optionalText = (maxLength) =>
  z.string().trim().max(maxLength).nullable().optional();

const memberFields = {
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),

  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase())
    .nullable()
    .optional(),

  phone: optionalText(30),
  address: optionalText(300),

  dateOfBirth: z
    .union([
      z.iso.date(),
      z.iso.datetime({ offset: true }),
    ])
    .nullable()
    .optional(),

  joinedAt: z
    .string()
    .datetime({ offset: true })
    .optional(),

  membershipStatus: z
    .enum(["active", "inactive", "archived"])
    .optional(),

  user: objectId.nullable().optional(),

  notes: optionalText(2000),
};

export const createMemberSchema = z.object({
  body: z.object({
    firstName: memberFields.firstName,
    lastName: memberFields.lastName,
    email: memberFields.email,
    phone: memberFields.phone,
    address: memberFields.address,
    dateOfBirth: memberFields.dateOfBirth,
    joinedAt: memberFields.joinedAt,
    user: memberFields.user,
    notes: memberFields.notes,
  }).strict(),

  params: z.object({}),
  query: z.object({}),
});

export const updateMemberSchema = z.object({
  body: z.object({
    firstName: memberFields.firstName.optional(),
    lastName: memberFields.lastName.optional(),
    email: memberFields.email,
    phone: memberFields.phone,
    address: memberFields.address,
    dateOfBirth: memberFields.dateOfBirth,
    joinedAt: memberFields.joinedAt,
    membershipStatus: memberFields.membershipStatus,
    user: memberFields.user,
    notes: memberFields.notes,
  }).strict().refine(
    (body) => Object.keys(body).length > 0,
    "Provide at least one field to update"
  ),

  params: z.object({
    id: objectId,
  }),

  query: z.object({}),
});

export const memberIdSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectId,
  }),
  query: z.object({}),
});

export const listMembersSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    membershipStatus: z
      .enum(["active", "inactive", "archived"])
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});