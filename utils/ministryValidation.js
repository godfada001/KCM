import { z } from "zod";

const objectId = z.string().regex(
  /^[a-f\d]{24}$/i,
  "Invalid ID"
);

const meetingDay = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const nullableText = (max) =>
  z.string().trim().max(max).nullable().optional();

const ministryFields = {
  name: z.string().trim().min(2).max(100),

  description: nullableText(2000),

  leader: objectId.nullable().optional(),

  status: z.enum(["active", "inactive", "archived"]).optional(),

  meetingDay: meetingDay.nullable().optional(),

  meetingTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable()
    .optional(),

  meetingLocation: nullableText(200),
};

export const createMinistrySchema = z.object({
  body: z.object({
    name: ministryFields.name,
    description: ministryFields.description,
    leader: ministryFields.leader,
    meetingDay: ministryFields.meetingDay,
    meetingTime: ministryFields.meetingTime,
    meetingLocation: ministryFields.meetingLocation,
  }).strict(),

  params: z.object({}),
  query: z.object({}),
});

export const updateMinistrySchema = z.object({
  body: z.object({
    name: ministryFields.name.optional(),
    description: ministryFields.description,
    leader: ministryFields.leader,
    status: ministryFields.status,
    meetingDay: ministryFields.meetingDay,
    meetingTime: ministryFields.meetingTime,
    meetingLocation: ministryFields.meetingLocation,
  }).strict().refine(
    (body) => Object.keys(body).length > 0,
    "Provide at least one field to update"
  ),

  params: z.object({ id: objectId }),
  query: z.object({}),
});

export const ministryIdSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({}),
});

export const listMinistriesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(["active", "inactive", "archived"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const addMinistryMemberSchema = z.object({
  body: z.object({
    memberId: objectId,
  }).strict(),

  params: z.object({ id: objectId }),
  query: z.object({}),
});

export const ministryMemberParamsSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: objectId,
    memberId: objectId,
  }),
  query: z.object({}),
});

export const listMinistryMembersSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({
    status: z.enum(["active", "inactive"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});